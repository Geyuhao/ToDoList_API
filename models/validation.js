var UserModel = require('./user.js');
var TaskModel = require('./task.js');
const mongoose = require('mongoose');

// validate when adding a new user
const validateNewUser = async (req, res) => {
    if (!req.body.name) {
        return res.status(400).send({ message: 'Name Required', data: [] });
    }
    if (!req.body.email) {
        return res.status(400).send({ message: 'Email Required', data: [] });
    }
    const match = await UserModel.findOne({ email: req.body.email }).exec();
    if (match != null) {
        return res.status(400).send({ message: 'Email Duplicate', data: [] });
    }
    return null;
}

// validate when updating a user
const validateUpdateUser = async (req, res) => {
    const id = req.params.userId;
            
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send({ message: 'Invalid ID', data: [] });
    }

    const foundUser = await UserModel.findById(id).exec();
    if (!foundUser) {
        return res.status(404).send({ message: 'User Not Found', data: [] });
    }

    if (!req.body.name) {
        return res.status(400).send({ message: 'Name Required', data: [] });
    }
    if (!req.body.email) {
        return res.status(400).send({ message: 'Email Required', data: [] });
    }
    return null;
}

// find user 
const findUser = async (req, res) => {
    const id = req.params.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return { status: 'error', data: res.status(400).send({ message: 'Invalid ID', data: [] }) };
    }

    const foundUser = await UserModel.findById(id).exec();
    if (!foundUser) {
        return { status: 'error', data: res.status(404).send({ message: 'User Not Found', data: [] }) };
    }

    return { status: 'success', data: foundUser };
};

// validate when adding a new task
const validateNewTask = async (req, res) => {
    if (!req.body.name) {
        return res.status(400).send({ message: 'Task Name Required', data: [] });
    }
    if (!req.body.deadline) {
        return res.status(400).send({ message: 'Task Deadline Required', data: [] });
    }
    return null;
};

// validate when updating a task
const validateUpdateTask = async (req, res) => {
    const id = req.params.taskId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send({ message: 'Invalid Task ID', data: [] });
    }

    const foundTask = await TaskModel.findById(id).exec();
    if (!foundTask) {
        return res.status(404).send({ message: 'Task Not Found', data: [] });
    }

    if (!req.body.name) {
        return res.status(400).send({ message: 'Task Name Required', data: [] });
    }

    if (!req.body.deadline) {
        return res.status(400).send({ message: 'Deadline Required', data: [] });
    }
    return null;
};

// find task
const findTask = async (req, res) => {
    const id = req.params.taskId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return { status: 'error', data: res.status(400).send({ message: 'Invalid Task ID', data: [] }) };
    }

    const foundTask = await TaskModel.findById(id).exec();
    if (!foundTask) {
        return { status: 'error', data: res.status(404).send({ message: 'Task Not Found', data: [] }) };
    }

    return { status: 'success', data: foundTask };
};

module.exports = {
    validateNewUser,
    validateUpdateUser,
    findUser,
    validateNewTask,
    validateUpdateTask,
    findTask
};