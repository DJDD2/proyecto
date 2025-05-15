const task = require('../models/Task');
const Taks = require('../models/Task');
const User = require('../models/User');
const excelJS = require('exceljs');
// @ desc Export all taks as an excel file 
// @route 
// @access 

const exportTasksReport = async (req, res) => {
    try {
        const taks = await Taks.find({}).populate("assignedTo", "name email");
        const workbook = new excelJS.Workbook();
        const worksheet = workbook.addWorksheet("Tasks Report");   
        worksheet.columns = [
            { header: "Task ID", key: "_id", width: 20 },
            { header: "Title", key: "title", width: 30 },
            { header: "Description", key: "description", width: 50 },
            { header: "Assigned To", key: "assignedTo.name", width: 30 },
            { header: "Status", key: "status", width: 20 },
            {heaeder: "Due Date", key: "dueDate", width: 20},
            {header: "Assigned To", key : "assignedTo", with:30},
            { header: "Created At", key: "createdAt", width: 20 },
        ];

        taks.forEach((taks)=> {
            const assignedTo = taks.assignedTo.map((user) => ' ${user.name} (${user.email})')
            .map((user) => user.name + " (" + user.email + ")")
            .join(",");
            worksheet.addRow({
                _id:taks._id,
                title: taks.title,
                description: taks.description,
                priority: getTasks.priority,
                dueDate: taks.dueDate.toISOString().split("T")[0],
                assignedTo: assignedTo || "Unassigned",

            });

        });

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ); 
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=tasks_report_${new Date().toISOString()}.xlsx`
        )
        return workbook.xlsx.write(res).then(() => {
            res.end();
        });
    } catch (error) {
        res.status(500).json({ message: "ERROR EXPORITN TAKS ", error: error.message });
    }
}

// @desc Export all users as an excel file
// @route GET /api/reports/export/users
// @access Private Admin
const exportUsersReport = async (req, res) => {
    try {
        const users = await User.find({}).select("-name email _id").lean();

        const userTasks = await task.find().populate("assignedTo", "name email _id");

        const userTasksMap={};
            users.forEach((user) => {
                userTasksMap[user._id] = {
                    name: user.name,
                    email: user.email,
                    tasksCount: 0,
                    pendingTasks: 0,
                    inProgressTasks: 0, 
                    completedTasks: 0,
                };
        
      });


      userTasks.forEach((task) => {
        if(task.assignedTo) {
            task.assignedTo.forEach((assignedUser) => {
                if(userTasksMap[assignedUser._id]) {
                    userTasksMap[assignedUser._id].tasksCount += 1;
                    if(task.status === "Pending") {
                        userTasksMap[assignedUser._id].pendingTasks += 1;
                    } else if(task.status === "In Progress") {
                        userTasksMap[assignedUser._id].inProgressTasks += 1;
                    } else if(task.status === "Completed") {
                        userTasksMap[assignedUser._id].completedTasks += 1;
                    }
                }
            });
        }
      });

        const workbook = new excelJS.Workbook();
        const worksheet = workbook.addWorksheet("Users Task  Report");




        worksheet.columns = [
            
            { header: "User Name", key: "name", width: 30 },
            { header: "Email", key: "email", width: 40 },
            { header: "Total Assigne Taks ", key: "tasksCount", width: 20 },
            { header: "Pending Tasks ", key: "pendingTasks", width: 20 },
            { header: "I Progress Tasks", key: "inProgressTasks", width: 20 },
       
            { header: "Completed Tasks", key: "completedTasks", width: 20 },
         
        ];
        Object.values(userTasksMap).forEach((user) => {
            worksheet.addRow(user);
        });


        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=users_report_${new Date().toISOString()}.xlsx`
        );
        return workbook.xlsx.write(res).then(() => {
            res.end();
        });
    } catch (error) {
        res.status(500).json({ message: "ERROR EXPORTING USERS ", error: error.message });
    }
};
module.exports = {
    exportTasksReport,
    exportUsersReport,
};