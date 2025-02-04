'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	Task = mongoose.model('Task'),
	_ = require('lodash');

/**
 * Create a Task
 */
exports.create = function(req, res) {
	var parTask = req.body.parTask;
	delete req.body.parTask;
	if(req.body.owners.users) {
		console.log(req.body.owners.users);
		req.body.owners.users = req.body.owners.users.map(function(usr) {
			return {
				user: usr
			};
		});
	}
	if(req.body.workers.users) {
		req.body.workers.users = req.body.workers.users.map(function(usr) {
			return {
				user: usr
			};
		});
	}
	var task = new Task(req.body);
	if(parTask) {
		Task.findById(parTask).exec(function(err, parentTask) {
			if(err) {
				return res.status(400).send({
					message: errorHandler.getErrorMessage(err)
				});
			} else {
				task.path = parentTask.path.concat(parTask);
				task.project = parentTask.project;
				task.save(function(err) {
					if (err) {
						return res.status(400).send({
							message: errorHandler.getErrorMessage(err)
						});
					} else {
						res.jsonp(task);
					}
				});
			}
		});
	} else {
		task.save(function(err) {
			if (err) {
				return res.status(400).send({
					message: errorHandler.getErrorMessage(err)
				});
			} else {
				res.jsonp(task);
			}
		});
	}
};

/**
 * populate Thread
 */
exports.popTasks = function(rootTasks, callback) {
	var rootIds = rootTasks.map(function(a) {
		return a._id;
	});
	Task.find({'path': {$in: rootIds}}).populate('owners.users.user', 'displayName profpic').populate('owners.team','name').populate('workers.users.user', 'displayName profpic').populate('workers.team','name').lean().exec(function(err, tasks) {
		if(err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			tasks = tasks.sort(function(a, b) {
				return a.path.length - b.path.length;
			});
			var map = {};
			rootTasks.forEach(function(rootTask) {
				rootTask.subTasks = [];
				map[rootTask._id] = rootTask;
			});
			tasks.forEach(function(task) {
				map[task._id] = task;
				task.subTasks = [];
				map[task.path[task.path.length-1]].subTasks.push(task);
			});
			callback();
		}
	});
}

/**
 * Show the current Task
 */
exports.read = function(req, res) {
	exports.popTasks([req.task], function() {
		res.jsonp(req.task);
	})
};

/**
 * Update a Task
 */
exports.update = function(req, res) {
	var task = req.task ;

	task = _.extend(task , req.body);

	task.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(task);
		}
	});
};

/**
 * Delete an Task
 */
exports.delete = function(req, res) {
	var task = req.task ;

	task.remove(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(task);
		}
	});
};

/**
 * List of Tasks
 */
exports.list = function(req, res) { 
	Task.find().populate('owners.users.user', 'displayName').populate('owner.team').populate('workers.users.user', 'displayName').populate('workers.team').populate('path').populate('project').lean().exec(function(err, tasks) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			exports.popTasks(tasks, function() {
				res.jsonp(tasks);
			});
		}
	});
};

/**
 * Task middleware
 */
exports.taskByID = function(req, res, next, id) {
	Task.findById(id).populate('owners.users.user', 'displayName profpic').populate('owners.team').populate('workers.users.user', 'displayName profpic').populate('workers.team').populate('path').populate('project').lean(req.originalMethod == 'GET').exec(function(err, task) {
		if (err) return next(err);
		if (! task) return next(new Error('Failed to load Task ' + id));
		req.task = task;
		next();
	});
};

/**
 * Task authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
//	if (req.task.user.id !== req.user.id) {
//		return res.status(403).send('User is not authorized');
//	}
	next();
};
