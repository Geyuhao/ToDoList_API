const TaskModel = require('../models/task.js');
const UserModel = require('../models/user.js');
const { validateUpdateTask, findTask }  = require('../models/validation.js');

const sendServerError = (response, err) => {
    return response.status(500).send({ message: 'Server Error', data: [] });
};

const sendTaskInfo = (response, taskData) => {
    return response.status(200).send({ message: 'Task Retrieved', data: taskData });
};

const updateTask = (response, updatedData) => {
    return response.status(200).send({ message: 'Task Updated', data: updatedData });
};

module.exports = function(taskRouter) {
    const singleTaskRoute = taskRouter.route('/tasks/:taskId');

    singleTaskRoute.get(async (request, response) => {
        try {
            const result = await findTask(request, response);
            if (result.status === 'error') {
                return result.data;
            } else {
                foundTask = result.data;
                sendTaskInfo(response, foundTask);
            }
        } catch (err) {
            console.log(err);
            sendServerError(response, err);
        }
    });

    singleTaskRoute.put(async (request, response) => {
        try {
            const id = request.params.taskId;
    
            const validationError = await validateUpdateTask(request, response);
            if (validationError) return validationError;
    
            const originalTask = await TaskModel.findById(id).exec();
            const taskUpdate = await TaskModel.findByIdAndUpdate(id, request.body, { new: true }).exec();
    
            // Check if assignedUser has changed
            if (originalTask.assignedUsername !== taskUpdate.assignedUsername) {
                // Remove task from original user's tasklist
                await UserModel.updateOne(
                    { username: originalTask.assignedUsername },
                    { $pull: { pendingTasks: originalTask._id } }
                );
                
                // Add task to new user's tasklist
                await UserModel.updateOne(
                    { username: taskUpdate.assignedUsername },
                    { $addToSet: { pendingTasks: taskUpdate._id } }
                );
            }
    
            updateTask(response, taskUpdate);
        } catch (err) {
            console.log(err);
            sendServerError(response, err);
        }
    });
    

    singleTaskRoute.delete(async (request, response) => {
        try {
            const result = await findTask(request, response);
            if (result.status === 'error') {
                return result.data;
            } else {
                foundTask = result.data;

                await UserModel.updateMany(
                    { _id: { $in: foundTask.assignedUsers } },
                    { $pull: { pendingTasks: foundTask._id } }
                );

                await foundTask.remove();
                response.status(200).send({ message: 'Task Deleted', data: [] });
            }
        } catch (err) {
            console.log(err);
            sendServerError(response, err);
        }
    });

    return taskRouter;
};
