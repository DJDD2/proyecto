const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//generate jwt 
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "30d",
    });
}


// @desc register user 
//outer 
//@access
const registerUser = async (req, res) => {
    try {
        const { name, email, password ,profileImageUrl,adminInviteToken} = req.body;

        //check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        // determine user role admin if correct token is provides +
        let role="member";
        if(adminInviteToken && adminInviteToken === process.env.ADMIN_INVITE_TOKEN){
            role="admin";
        }   
        // hash pasword

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            profileImageUrl,
            role
        });

        // return
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            profileImageUrl: user.profileImageUrl,
            role: user.role,
            token: generateToken(user._id),
        });
    } catch (error) {
        res
    }
}

// @desc register user 
//outer 
//@access
const loginUser = async (req, res) => {
     try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if(!user){
            return res.status(400).json({ message: "Invalid email or password" });
            
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json({ message: "Invalid email or password" });
        }

        //return user data 
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            profileImageUrl: user.profileImageUrl,
            role: user.role,
            token: generateToken(user._id),
        });
    } catch (error) {
        res
    }
}

// @desc register user 
//outer 
//@access
const getUserProfile = async (req, res) => {
     try {
    const user = await User.findById(req.user.id ).select("-password");
    if(!user){
        return res.status(404).json({ message: "User not found" });
    }
    res.json(user)
    } catch (error) {
        res
    }}


// @desc update profile  
//outer 
//@access private require jwt
const updateUserProfile = async (req, res) => { 
    try {
            const user = await User.findById(req.user.id ).select("-password");
            if(!user){
                return res.status(404).json({ message: "User not found" });

            
            }
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;

            if(req.body.password){
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(req.body.password, salt);
            }

            const updateUser=await User.save();
            res.status(200).json({
                _id: updateUser._id,
                name: updateUser.name,
                email: updateUser.email,
                profileImageUrl: updateUser.profileImageUrl,
                role: updateUser.role,
                token: generateToken(updateUser._id),
            });
    } catch (error) {
        res
    }};

module.exports = {registerUser, loginUser, getUserProfile, updateUserProfile};

