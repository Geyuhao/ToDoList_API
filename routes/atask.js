const TaskModel = require('../models/task.js');
const UserModel = require('../models/user.js');
const { validateUpdateTask, findTask, findUser }  = require('../models/validation.js');

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
    
            if (request.body.assignedUser){
                const result = await findUser({ params: { userId: request.body.assignedUser } }, response);
                if(result.status === 'error'){
                    return result.data;
                }
            }
 
            const originalTask = await TaskModel.findById(id).exec();
            const taskUpdate = await TaskModel.findByIdAndUpdate(id, request.body, { new: true }).exec();
    

            if (originalTask.assignedUser !== taskUpdate.assignedUser || taskUpdate.completed) {

                // Remove task from original user's tasklist
                await UserModel.findByIdAndUpdate(
                    originalTask.assignedUser,
                    { $pull: { pendingTasks: originalTask._id } }
                ).exec();
    

                // Check if assignedUser has changed
                if (!taskUpdate.completed &&  originalTask.assignedUser !== taskUpdate.assignedUser) {
                    // Fetch the new user's details
                    const newUser = await UserModel.findById(taskUpdate.assignedUser).exec();
                    
                    // Add task to new user's tasklist
                    await UserModel.findByIdAndUpdate(
                        taskUpdate.assignedUser,
                        { $addToSet: { pendingTasks: taskUpdate._id } }
                    ).exec();
        
                    // Update task's assignedUserName based on the new user's name
                    taskUpdate.assignedUserName = newUser.name;
                    await taskUpdate.save();
                }
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
    
                // If the task is assigned to a user, update the user's pendingTasks
                if (foundTask.assignedUser) {
                    await UserModel.findByIdAndUpdate(
                        foundTask.assignedUser,
                        { $pull: { pendingTasks: foundTask._id } }
                    ).exec();
                }
    
                // Delete the task
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
