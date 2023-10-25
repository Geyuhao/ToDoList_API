const UserModel = require('../models/user.js');
const TaskModel = require('../models/task.js');
const { validateUpdateUser, findUser }  = require('../models/validation.js');

const sendServerError = (response, err) => {
    return response.status(500).send({ message: 'Server Error', data: [] });
};

const sendUserInfo = (response, userData) => {
    return response.status(200).send({ message: 'User Retrieved', data: userData });
};

const updateUser = (response, updatedData) => {
    return response.status(200).send({ message: 'User Updated', data: updatedData });
};

module.exports = function(userRouter) {
    const singleUserRoute = userRouter.route('/users/:userId');

    singleUserRoute.get(async (request, response) => {
        try {
            const result = await findUser(request, response);
            if(result.status === 'error'){
                return result.data;
            } else{
                foundUser = result.data;
                sendUserInfo(response, foundUser)
            }
        } catch (err) {
            console.log(err);
            sendServerError(response, err);
        }
    });


    singleUserRoute.put(async (request, response) => {
        try {
            const id = request.params.userId;
    
            const validationError = await validateUpdateUser(request, response);
            if (validationError) return validationError;
    
            const originalUser = await UserModel.findById(id).exec();
            const userUpdate = await UserModel.findByIdAndUpdate(id, request.body, { new: true }).exec();
    
            // Check if pendingTasks has changed
            if (JSON.stringify(originalUser.pendingTasks) !== JSON.stringify(userUpdate.pendingTasks)) {
                // Remove user from original tasks' assignedUsers
                await TaskModel.updateMany(
                    { _id: { $in: originalUser.pendingTasks }},
                    { $pull: { assignedUsers: originalUser._id }}
                );
    
                // Add user to new tasks' assignedUsers
                await TaskModel.updateMany(
                    { _id: { $in: userUpdate.pendingTasks }},
                    { $addToSet: { assignedUsers: userUpdate._id }}
                );
            }
    
            updateUser(response, userUpdate);
        } catch (err) {
            console.log(err);
            sendServerError(response, err);
        }
    });
    

    singleUserRoute.delete(async (request, response) => {
        try {
            const result = await findUser(request, response);
            if(result.status === 'error'){
                return result.data;
            } else{
                foundUser = result.data;

                // TODO debug this
                await TaskModel.updateMany(
                    { _id: { $in: foundUser.pendingTasks } },
                    { $pull: { assignedUsers: foundUser._id } }
                );

                await foundUser.remove();
                response.status(200).send({ message: 'User Deleted', data: [] });
            }

        } catch (err) {
            console.log(err);
            sendServerError(response, err);
        }
    });

    return userRouter;
};
