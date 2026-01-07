const mongoose = require("mongoose");

const UsersSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    profilePic: {
        type: String,
        required: false
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    birthday: {
        type: Date,
        required: true
    }
});

const Users = mongoose.model("users", UsersSchema);
module.exports = Users;