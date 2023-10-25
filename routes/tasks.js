var User = require('../models/user.js');
var Task = require('../models/task.js');
const { validateNewTask }  = require('../models/validation.js');

module.exports = function (router) {
    var tasksRoute = router.route('/tasks');

    tasksRoute.get(async (req, res) => {
        try {
            const { where, sort, select, skip, limit, count } = req.query;
            // console.log(req.query);
            const query = Task.find(where).sort(sort).select(select).skip(skip).limit(limit);
            const tasks = await query.exec();
    
            if (count) {
                return res.status(200).send({
                    message: 'Tasks Retrieved',
                    data: tasks.length
                });
            } else {
                return res.status(200).send({
                    message: 'Tasks Retrieved',
                    data: tasks
                });
            }
        } catch (err) {
            res.status(500).send(err);
        }
    });

    tasksRoute.post(async (req, res) => {
        var task = new Task();
        try {
            const validationError = await validateNewTask(req, res);
            if (validationError) return validationError;

            task.name = req.body.name;
            task.deadline = req.body.deadline;
    
            task.description = req.body.description || "";
            task.completed = req.body.completed || false;
    
            if (req.body.assignedUser && req.body.assignedUser.length > 0) {
                const user = await User.findById(req.body.assignedUser).exec();
                if (user == null) {
                    task.assignedUser = "";
                    task.assignedUserName = "unassigned";
                } else {
                    task.assignedUser = user.id;
                    task.assignedUserName = user.name;
                    if (!task.completed) {
                        user.pendingTasks.push(task.id);
                        await user.save();
                    }
                }
            } else {
                task.assignedUser = "";
                task.assignedUserName = "unassigned";
            }
    
            await task.save();
            return res.status(201).send({ message: 'Task Created', data: task });
    
        } catch (err) {
            return res.status(500).send({ message: 'Server Error', data: [] });
        }
    });
    
    
    return router;
}