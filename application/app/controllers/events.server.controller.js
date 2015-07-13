'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	Event = mongoose.model('Event'),
    EventType = mongoose.model('EventType'),
    MongoPromise = require('mongoose').Types.Promise,
	_ = require('lodash');

/**
 * Create an Event
 */
exports.create = function(req, res) {
    var evType = req.body.type;
    delete req.body.type;
	var event = new Event(req.body);
	event.user = req.user;
    //event.guests = {"user": req.user,"status": 'Attending'};
    //for(var dt in event.requestedDateTimeRange.dateTime) {
        //for(var param in dt.parameters) {
            
        //}
    //}
    
    event.scheduledDateTimeRange.start = event.requestedDateTimeRange.dateTimes[0].start;
    
    EventType.findOneAndUpdate({name: evType},{name: evType},{upsert: true}).exec(function(err,evntType) {
        if(err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            event.type = evntType;

            event.save(function(err) {
                if(err) {
                    return res.status(400).send({
                        message: errorHandler.getErrorMessage(err)
                    });   
                } else {
                    return res.jsonp(event);
                }
            });
        }
    });
};

/**
 * Show the current Event
 */
exports.read = function(req, res) {
	res.jsonp(req.event);
};

/**
 * Update an Event
 */
exports.update = function(req, res) {
	var event = req.event ;

	event = _.extend(event , req.body);

	event.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(event);
		}
	});
};

/**
 * Delete an Event
 */
exports.delete = function(req, res) {
	var event = req.event ;

	event.remove(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(event);
		}
	});
};

/**
 * List of Events
 */
exports.list = function(req, res) {
    var roles = ['admin'];
    if(_.intersection(req.user.roles,roles).length) {
        Event.find().sort('-created').populate('user', 'displayName').populate('project', 'name').exec(function(err, events) {
            if (err) {
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                });
            } else {
                res.jsonp(events);
            }
        });
    } else {
        Event.find({$or: [{user: req.user._id},{'guests.user': req.user._id}]}).sort('-created').populate('user', 'displayName').populate('project', 'name').exec(function(err, events) {
            if (err) {
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                });
            } else {
                res.jsonp(events);
            }
        });
    }
};

/**
 * Get list of event types
 */
exports.getTypes = function(req, res) {
    EventType.find().exec(function(err, types) {
        res.jsonp(types);
    });
};

/**
 * Save a new event type
 */
exports.addType = function(req, res) {
    var eventType = new EventType(req.body);
	
	eventType.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json(eventType);
		}
	});
};

/**
 * Archive an event type
 */
exports.updateType = function(req, res) {
	var eventType = req.eventType;

	eventType = _.extend(eventType, req.body);

	eventType.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json(eventType);
		}
	});
};

/**
 * Event middleware
 */
exports.eventByID = function(req, res, next, id) { 
	Event.findById(id).populate('user', 'displayName').populate('project', 'name').populate('type','name').exec(function(err, event) {
		if (err) return next(err);
		if (! event) return next(new Error('Failed to load Event ' + id));
		req.event = event;
		next();
	});
};

/**
 * Event Type middleware
 */
exports.eventTypeByID = function(req, res, next, id) { 
	EventType.findById(id).populate('user', 'displayName').exec(function(err, eventType) {
		if (err) return next(err);
		if (! eventType) return next(new Error('Failed to load EventType ' + id));
		req.eventType = eventType;
		next();
	});
};


/**
 * Event authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.event.user.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};