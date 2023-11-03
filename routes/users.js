var User = require('../models/user.js');
var Task = require('../models/task.js');
const { validateNewUser }  = require('../models/validation.js');

module.exports = function (router) {
    var userRoute = router.route('/users');
    
    userRoute.get(async (req, res) => {
        try {
            const { where, sort, select, skip, limit, count } = req.query;
            // console.log(req.query);
            const query = User.find(where).sort(sort).select(select).skip(skip).limit(limit);
            const users = await query.exec();
    
            if (count) {
                return res.status(200).send({
                    message: 'Users Retrieved',
                    data: users.length
                });
            } else {
                return res.status(200).send({
                    message: 'Users Retrieved',
                    data: users
                });
            }
        } catch (err) {
            res.status(500).send(err);
        }
    });
    
    
    userRoute.post(async (req, res) => {
        var user = new User();
        try {
            const validationError = await validateNewUser(req, res);
            if (validationError) return validationError;

            user.name = req.body.name;
            user.email = req.body.email;
    
            const taskPromises = (req.body.pendingTasks || []).map(id => Task.findById(id).exec());
            const tasks = await Promise.all(taskPromises);
            user.pendingTasks = tasks.filter(task => task != null).map(task => task.id);
            
            await user.save();

            const finalPromises = [];
            for (const task of tasks) {
                if (task != null) {
                    task.completed = false;
                    task.assignedUser = user.id;
                    task.assignedUserName = user.name;
                    finalPromises.push(task.save());
                }
            }
            await Promise.all(finalPromises);
            
            return res.status(201).send({ message: 'User Created', data: user });
        } catch (err) {
            return res.status(500).send({ message: 'Server Error', data: err.message });
        }
    });
    

    return router;
}