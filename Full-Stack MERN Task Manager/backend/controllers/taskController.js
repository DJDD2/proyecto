const Task = require("../models/Task");
const User = require("../models/User");

// @desc Get all tasks (admin sees all, user sees assigned only)
// @route GET /api/tasks/
// @access Private
const getTasks = async (req, res) => {
    try {
        const {status }= req.query;
        let filter ={};

        if (status) {
            filter.status=status;
        }
        let tasks;
        if(req.user.role === "admin")  {
            tasks = await Task.find(filter).populate("assignedTo", "name email profileImageUrl");
        } else {
            // Only fetch tasks assigned to the current user
            tasks = await Task.find({ ...filter, assignedTo: req.user.id }).populate("assignedTo", "name email profileImageUrl");
        }

        //add completed todochecklist count to each task 
        tasks = await Promise.all(tasks.map(async (task) => {
            const completedCount = task.todoChecklist.filter(item => item.isCompleted).length;
        return {...task._doc, completedCount: completedCount };
        })
        );

        // satus summary counts 
        const allTasks = await  Task.countDocuments(
            req.user.role=== "amin "? {}: {assignedTo: req.user._id}
        )
        const pendingTasks = await Task.countDocuments({
            ...filter,
            status: "Pening",
            ...( req.user.role !== "admin" && { assignedTo: req.user.id }),
        })

        const inProgressTasks = await Task.countDocuments({
            ...filter,
            status: "In Progress",
            ...( req.user.role !== "admin" && { assignedTo: req.user.id }),
        })

        const completedTasks = await Task.countDocuments({
            ...filter,
            status: "Completed",
            ...( req.user.role !== "admin" && { assignedTo: req.user.id }),
        })
        res.json({
            tasks,
            statusSummary:{
                all: allTasks,
                pendingTasks,
                inProgressTasks,
                completedTasks,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get task by ID
// @route GET /api/tasks/:id
// @access Private
const getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id).populate("assignedTo", "name email profileImageUrl");
        if (!task) return res.status(404).json({ message: "Task not found" });


        res.json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Create a new task (admin only)
// @route POST /api/tasks/
// @access Private
const createTask = async (req, res) => {
    try {


        const {
            title,
            description,
            priority,
            dueDate,
            assignedTo,
            attachments,
            todoChecklist,
        }= req.body;

        if(!Array.isArray(assignedTo)){
            return res.status(400).json({ message: "AssignedTo must be an array" });
        }
        

        const task = await Task.create({
            tittle,
            escription,
            priority,
            dueDate,
            assignedTo,
            createdBy: req.user.id,
            todoChecklist,
            attachments,
        })
        res.status(201).json({message : "Task created successfully", task});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Update task by ID
// @route PUT /api/tasks/:id
// @access Private
const updateTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: "Task not found" });

        task.title = req.body.title || task.title;
        task.description = req.body.description || task.description;
        task.priority = req.body.priority || task.priority;
        task.dueDate = req.body.dueDate || task.dueDate;
        task.todoChecklist = req.body.todoChecklist || task.todoChecklist;
        task.attachments = req.body.attachments || task.attachments;

        if(req.body.assignedTo){
            if(!Array.isArray(req.body.assignedTo)){
                return res.status(400).json({ message: "AssignedTo must be an array" });
            }
            task.assignedTo = req.body.assignedTo;
        }

        
        const updatedTask = await task.save();
        res.json({mesagge:"Task upated successfully ",updatedTask});
    } catch (error) {
        res.status(500).json({message: "server error", message: error.message });
    }
};

// @desc Delete a task (admin only)
// @route DELETE /api/tasks/:id
// @access Private
const deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: "Task not found" });

        await task.deleteOne();
        res.json({ message: "Task deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Update task status
// @route PUT /api/tasks/:id/status
// @access Private
const updateTaskStatus = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: "Task not found" });

       const isAssigned = tasks.assignedTo.some(
        (userId) => userId.toString() === req.user.id.toString()
       );
         if (!isAssigned && req.user.role !== "admin") {
                return res.status(403).json({ message: "You are not authorized to update this task" });
          }
    
          task.status = req.body.status || task.status;
         
          if(tasks.status=== "completed"){
            task.todoChecklist.forEach((item) => (item.completed = true ));
            task.progress = 100;

          }

          await task.save();
          res.json({ message: "Task status updated successfully", task });
          
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Update task checklist item status
// @route PUT /api/tasks/:id/checklist
// @access Private
const updateTaskChecklist = async (req, res) => {
    try {
        const { todoCheckList} = req.body;
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: "Task not found" });

        if(!task.assignedTo.includes(req.user._id) && req.user.role !== "admin"){
         return res
         .status(403)
         .json({ message: "not authirized to upate checklist" });        
        }

        task.todoCheckList = todoChecklist;

        //auto-update progress based on ckecklist comopletion
        const completedCount = task.todoChecklist.filter(item => item.isCompleted).length;
        const totalItems = task.todoChecklist.length;
        task.progress= totalItems >0 ? Math.round((completedCount /totalItems)* 100):0;

        // auto-mark task as completed 
        if(task.progress === 100){
            task.status = "completed";

        }else if (task.progress>0){
        task.status = "In Progress";


        }else {
        task.status = "Pending";

        }
        await task.save();

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Dashboard Data (Admin only)
// @route GET /api/tasks/dashboard-data
// @access Private
const getDashboardData = async (req, res) => {
    try {
        //Fetch statistics

        const totalTasks = await Task.countDocuments();
        const pendingTasks = await Task.countDocuments({ status: "Pending" });
        const completedTasks = await Task.countDocuments({ status: "Completed" });
        const overdueTasks = await Task.countDocuments({ 
            status: {$ne:"Completed" },
            dueDate: { $lt: new Date() },
        });

        //Ensure all posible statuses are inclued 

        const taskStatus = ["Pending", "In Progress", "Completed"];
        const taskDistributionRaw= await Task.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]);
        const taskDistribution = taskStatus.map((status) => {
            const formattedKey = status.replace(/\s+/g,"") // remove spaces for response keys 
            acc[formattedKey] = 
            taskDistributionRaw.find((item) => item._id === status)?.count || 0;
            return acc;
        },{});

        taskDistribution["ALL"]= totalTasks;

        // ensure all priority levels are includes 
        const taksPriority = ["low", "medium", "high"];
        const taskPriorityLevelsRaw= await Task.aggregate([
        {
            $group: {
                _id: "$priority",
                count: { $sum: 1 },
            },
        },
        ]);
        const taskPriorityLevels = taksPriority.reduce((acc,priority) => {
            const formattedKey = priority.replace(/\s+/g,"") // remove spaces for response keys 
            acc[formattedKey] = 
            taskPriorityLevelsRaw.find((item) => item._id === priority)?.count || 0;
            return acc;
        },{});




        //fecht recent 10 tasks
        const recentTasks = await Task.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select("title status priority dueDate createdAt");

        res.status(200).json({  
            statistics:{
                totalTasks,
                pendingTasks,
                completedTasks,
                overdueTasks,
            },
            charts:{
                taskDistribution,
                taskPriorityLevels,
            },
            recentTasks,
         })
        res.json({ totalTasks, todoTasks, inProgressTasks, doneTasks });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc User-specific Dashboard Data
// @route GET /api/tasks/user-dashboard-data
// @access Private
const getUserDashboardData = async (req, res) => {
    try {
        const userId = req.user.id;

        //fecth statics foe user-specific tasks 
        const totalTasks = await Task.countDocuments({ assignedTo: req.user.id });
        const pendingTasks = await Task.countDocuments({ assignedTo: req.user.id, status: "Pending" });
        const completedTasks = await Task.countDocuments({ assignedTo: req.user.id, status: "Completed" });
        const overdueTasks = await Task.countDocuments({ assignedTo: req.user.id,
         status:{ $ne: "Completed" },
            dueDate: { $lt: new Date() },
        
     } );


     const taskStatus = ["Pending", "In Progress", "Completed"];
     const taskDistributionRaw= await Task.aggregate([
        {$match: { assignedTo: userId }},
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 },
            },
        }
     ]);

     const taskDistribution = taskStatus.reduce((acc, status) => {
        const formattedKey = status.replace(/\s+/g, ""); // remove spaces for response keys 
        acc[formattedKey] =
            taskDistributionRaw.find((item) => item._id === status)?.count || 0;
            return acc;
     },{})
     taskDistribution["ALL"] = totalTasks;

     //Task distibution bu priority 
     const taksPriorities = ["low", "medium", "high"];
     const taskPriorityLevelsRaw = await Task.aggregate([

        { $match: { assignedTo: userId } },
        {
            $group: {
                _id: "$priority",
                count: { $sum: 1 },
            },
        },
     ])

     const taskPriorityLevels = taksPriorities.reduce((acc, priority) => {


        acc[priority] =
        taskPriorityLevelsRaw.find((item) => item._id === priority)?.count || 0;
        return acc;
     },{});

     //fetch recent 10 tasks for the logged-in user 
     const recentTasks = await Task.find({ assignedTo: userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("title status priority dueDate createdAt");
    
    res.status(200).json({
        statistics: {
            totalTasks,
            pendingTasks,
            completedTasks,
            overdueTasks,
        },
        charts: {
            taskDistribution,
            taskPriorityLevels,
        },
        recentTasks,
    });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    updateTaskChecklist,
    getDashboardData,
    getUserDashboardData,
};
