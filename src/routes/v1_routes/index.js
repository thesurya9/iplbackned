'use strict';
const router = require('express').Router();
const user = require('../../app/controller/user');
const job = require('../../app/controller/job');
const { upload } = require("./../../app/services/fileUpload");
const isAuthenticated = require("./../../middlewares/isAuthenticated");

// auth routes
router.post('/login', user.login);
router.post('/signUp', user.signUp);


router.post('/login', user.login);
router.post('/sendOTP', user.sendOTP);
router.post('/verifyOTP', user.verifyOTP);
router.post('/changePassword', user.changePassword);



// Service User
router.post('/jobs', isAuthenticated(['USER', 'ADMIN']), job.createJob);
router.get('/user/jobs', isAuthenticated(['USER', 'ADMIN']), job.listProviderJobs);
router.get('/user/jobs/:job_id', isAuthenticated(['USER', 'ADMIN']), job.jobDetails);
router.delete('/jobs/:job_id', isAuthenticated(['USER', 'ADMIN']), job.deleteJob);
router.put('/jobs/:job_id', isAuthenticated(['USER', 'ADMIN']), job.updateJob);
router.put('/user/review/:review_id?', isAuthenticated(['USER',]), job.addReview);
router.get('/user/history/:filter', isAuthenticated(['USER', 'ADMIN']), job.history);
router.get('/user/config', job.getConfig);
router.post('/settings', isAuthenticated(['USER', 'PROVIDER', 'ADMIN']), user.updateSettings);
router.get('/settings', isAuthenticated(['USER', 'PROVIDER', 'ADMIN']), user.getSettings);
// Service Provider
router.post('/provider/incident', isAuthenticated(['PROVIDER']), job.addIncident);
router.post('/provider/getAllIncident', isAuthenticated(['USER', 'ADMIN']), job.getIncident);
router.post('/provider/jobs/near', isAuthenticated(['PROVIDER']), job.jobsNearMe);
router.get('/provider/jobs/available/:filter?', isAuthenticated(['PROVIDER']), job.availableJobs);
router.put('/jobs/apply/:job_id', isAuthenticated(['PROVIDER', 'ADMIN']), job.apply);
router.get('/provider/myjobs', isAuthenticated(['PROVIDER']), job.upcommingJobs);
router.get('/provider/history/:filter', isAuthenticated(['PROVIDER',]), job.historyProvider);
// service provide + User
router.get('/jobs/:job_id', isAuthenticated(['USER', 'PROVIDER', 'ADMIN']), job.getJob);
router.delete('/jobs/reject/:job_id', isAuthenticated(['PROVIDER']), job.rejectInvite);
router.post('/profile/changePassword', isAuthenticated(['USER', 'PROVIDER']), user.changePasswordProfile);

router.get('/me', isAuthenticated(['USER', 'PROVIDER']), user.me);
router.post('/profile/update', isAuthenticated(['USER', 'PROVIDER', 'ADMIN']), user.updateUser);

router.post('/profile/file', isAuthenticated(['USER', 'PROVIDER']), upload.single('file'), user.fileUpload);

router.get('/notification', isAuthenticated(['USER', 'PROVIDER']), user.notification);

router.post('/jobEvents', isAuthenticated(['PROVIDER']), job.jobEvents);

router.post('/admin/jobs', isAuthenticated(['ADMIN', 'USER']), job.formatedJobs);
router.post('/admin/jobs/:job_id/assign', isAuthenticated(['ADMIN', 'USER']), job.assign);

router.get('/organizations', isAuthenticated(['ADMIN']), user.allOrganization);
router.post('/user/guardList', isAuthenticated(['USER', 'ADMIN']), user.guardListWithIdentity);
router.post('/user/guardListSearch', isAuthenticated(['USER', 'ADMIN']), user.guardListSearch);

//Surya's code
//test commeit

router.post('/user/verifyGuard', isAuthenticated(['USER', 'ADMIN']), user.verifyGuard);
router.post('/jobs/historyUserSearch', isAuthenticated(['USER', 'ADMIN']), job.historyUserSearch);
router.post('/user/getStaff', isAuthenticated(['USER', 'ADMIN']), user.getStaffList);
router.post('/provider/regClient', isAuthenticated(['USER', 'ADMIN']), user.regNewClient);
router.get('/provider/getClient', isAuthenticated(['USER', 'ADMIN']), user.getAllClients);


router.post('/jobs/createMatch', job.saveMatch);
router.post('/jobs/getAllMatch', job.getAllMatchs);
router.post('/jobs/prediction', job.createPrediction);
router.post('/jobs/saveNews', job.createNews);
router.post('/jobs/getAllNews', job.getAllNews);
router.post('/jobs/saveOtherInfo', job.saveOtherInfo);
router.post('/jobs/getAllOtherInfo', job.getAllOtherInfo);
router.post('/jobs/updateInfo', job.updateInfo);
router.post('/jobs/deleteOneMatch', job.deleteMatch);
router.post('/jobs/deleteOneNews', job.deleteNews);
router.post('/jobs/uploadTeam', upload.single('file'), job.uploadTeam);
router.post('/jobs/saveNewsWithImg', upload.single('file'), job.saveNewsWithImg);
router.post('/jobs/createSeries', job.saveSeries);
router.post('/jobs/getAllSeries', job.getAllSeries);



module.exports = router
