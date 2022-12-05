const mongoose = require("mongoose");
const response = require('./../responses');
const Job = mongoose.model('Job');
const Review = mongoose.model('Review');
const Incident = mongoose.model('Incident');
const JobInvite = mongoose.model('JobInvite');

const Match = mongoose.model('Match');
const News = mongoose.model('News');
const OtherInfo = mongoose.model('Otherinfo');
const Series = mongoose.model('Series');

const notification = require("./../services/notification");
const userHelper = require('./../helper/user');

module.exports = {

    createJob: async (req, res) => {
        try {
            const jobDetails = req.body;
            let job = new Job(jobDetails);
            job.startDate = new Date(jobDetails.startDate);
            job.endDate = new Date(jobDetails.endDate);
            job.posted_by = jobDetails.posted_by ? jobDetails.posted_by : req.user.id;
            if (jobDetails.staff && jobDetails.staff.length > 0) {
                job.public = false;
                const user = await userHelper.find({ _id: job.posted_by }).lean();
                for (let i = 0; i < jobDetails.staff.length; i++) {
                    let JobIn = await JobInvite.create({ invited: jobDetails.staff[i], job: job._id, by: job.posted_by });
                    notification.push(jobDetails.staff[i], `You have been invited by ${user.username} for a job.`, JobIn._id);
                }
            }
            job.location = {
                type: 'Point',
                // [longitude, latitude]--
                coordinates: jobDetails.location
            }

            if (jobDetails.client_id) {
                await ClientJob.create({ job_id: job._id, client_id: jobDetails.client_id });
            }

            await job.save();
            return response.ok(res, { id: job._id, message: "Job created!" });
        } catch (error) {
            return response.error(res, error);
        }
    },
    deleteJob: async (req, res) => {
        try {
            let job_id = req.params["job_id"];
            await Job.deleteOne({ _id: job_id });
            return response.ok(res, { message: "Job deleted!" });
        } catch (error) {
            return response.error(res, error);
        }
    },
    getJob: async (req, res) => {
        try {
            let job_id = req.params["job_id"];
            const job = await Job.findById(job_id);
            return response.ok(res, { job });
        } catch (error) {
            return response.error(res, error);
        }
    },
    updateJob: async (req, res) => {
        try {
            let job_id = req.params["job_id"];
            req.body.location = {
                type: 'Point',
                // [longitude, latitude]
                coordinates: req.body.location
            }
            const job = await Job.findByIdAndUpdate(job_id, req.body);
            return response.ok(res, { message: "Job updated!" });
        } catch (error) {
            return response.error(res, error);
        }
    },
    listProviderJobs: async (req, res) => {
        try {
            const jobs = await Job.find({ posted_by: req.user.id, endDate: { $gt: new Date().getTime() } });
            return response.ok(res, { jobs });
        } catch (error) {
            return response.error(res, error);
        }

    },
    addReview: async (req, res) => {
        try {
            const reviewDetails = req.body;
            reviewDetails.posted_by = req.user.id;
            if (req.params["review_id"]) {
                await Review.findByIdAndUpdate(req.params["review_id"], reviewDetails, { upsert: true });
            } else {
                let review = new Review({
                    title: reviewDetails.title,
                    details: reviewDetails.details,
                    rating: reviewDetails.rating,
                    job: reviewDetails.job_id,
                    posted_by: req.user.id,
                    for: reviewDetails.for
                });
                await review.save();
            }
            return response.ok(res, { message: "Review Added!" });
        } catch (error) {
            return response.error(res, error);
        }
    },
    addIncident: async (req, res) => {
        try {
            const incidentDetails = req.body;
            const incident = new Incident({
                title: incidentDetails.title,
                details: incidentDetails.details,
                job: incidentDetails.job_id,
                posted_by: req.user.id
            });
            await incident.save();
            return response.ok(res, { message: "Incident Added!" });
        } catch (error) {
            return response.error(res, error);
        }
    },
    getIncident: async (req, res) => {
        try {
            let incident = await Incident.find().populate("posted_by", 'fullName');
            return response.ok(res, { incident });
        } catch (error) {
            return response.error(res, error);
        }
    },
    getConfig: async (req, res) => {
        try {
            return response.ok(res, {
                title: [
                    // { type: "marriage_security", name: "Marrige Security Guard" },
                    { type: "event_security", name: "Event Security" },
                    { type: "body_guards", name: "Body Guards" },
                    { type: "concierge_receptionist", name: "Concierge/Receptionist" },
                    { type: "door_staff", name: "Door Staff" },
                    { type: "club_security", name: "Club Security" },
                    { type: "canine_dog_handlers", name: "Canine/Dog handlers" },
                    { type: "retail_security", name: "Retail Security" },
                    { type: "key_holdings", name: "Key Holdings" },
                    { type: "carpark_security", name: "Carpark Security" },
                    { type: "access_patrol", name: "Access patrol" },
                    { type: "empty_property", name: "Empty Property" },],
                jobType: [
                    { type: "event", name: "Event type" },
                    { type: "job", name: "Job type" },
                    { type: "security", name: "Security type" },
                    { type: "other", name: "Other type" }
                ],
                incidenceType: [
                    { type: "thieft", name: "Thieft" },
                    { type: "fight", name: "Fight" },
                    { type: "fire", name: "Fire" },
                    { type: "damage_to_property", name: "Damage To Property" },
                    { type: "others", name: "Others" },
                ]
            });
        } catch (error) {
            return response.error(res, error);
        }
    },
    jobDetails: async (req, res) => {
        try {
            const job = await Job.findById(req.params["job_id"]).populate("applicant", "fullName profile username").lean();
            const ids = job.applicant.map(a => a._id);
            const reviews = await Review.find({ for: { $in: ids }, job: job._id }).lean();
            const hash = {};
            reviews.map(r => {
                hash[r.for] = r;
            });
            job.applicant.map(a => {
                a.review = hash[a._id];
            });
            return response.ok(res, { job });
        } catch (error) {
            return response.error(res, error);
        }
    },
    availableJobs: async (req, res) => {
        try {
            let filter = req.params["filter"];
            const cond = { startDate: { $gt: new Date() }, public: true, applicant: { $ne: req.user.id } };
            let jobs = [];
            if (filter == 'ALL') {
                jobs = await Job.find(cond).lean();
            } else {
                jobs = await Job.find(cond).limit(5).lean();
            }
            jobs = jobs.map(j => {
                if (j.applicant && j.applicant.indexOf(req.user.id) > -1) {
                    j.applied = true;
                }
                return j;
            });
            return response.ok(res, { jobs });
        } catch (error) {
            return response.error(res, error);
        }
    },
    jobsNearMe: async (req, res) => {
        try {
            let user = await userHelper.find({ _id: req.user.id });
            let jobs = await Job.find({
                public: true,
                applicant: { $ne: req.user.id },
                location: {
                    $near: {
                        $maxDistance: (1609.34 * user.distance),
                        $geometry: {
                            type: "Point",
                            coordinates: req.body.location
                        }
                    }
                }
            }).lean();
            return response.ok(res, { jobs });
        } catch (error) {
            return response.error(res, error);
        }
    },
    upcommingJobs: async (req, res) => {
        try {
            let jobs = await Job.find({ endDate: { $gte: new Date().getTime() }, applicant: req.user.id }).lean();
            return response.ok(res, { jobs });
        } catch (error) {
            return response.error(res, error);
        }
    },
    apply: async (req, res) => {
        try {
            let job = await Job.findById(req.params["job_id"]);
            if (!job) return response.notFound(res, { message: "Job does not exist." });
            let set = new Set(job.applicant.map(a => a.toString()));
            if (set.has(req.user.id)) {
                return response.ok(res, { message: "You already applied to this job!" });
            }
            if (set.size == job.person) {
                return response.ok(res, { message: "Vacancy Full!" });
            }
            job.applicant.push(req.user.id);
            await job.save();
            let n_p = req.query["notification_page"];
            if (n_p) {
                await JobInvite.updateOne({ job: req.params["job_id"] }, { $set: { status: 'ACCEPTED' } });
            }
            notification.push(job.posted_by, `${req.user.user} ${n_p ? "accepted" : "applied"} and selected on the job you ${n_p ? "invited" : "posted"}.`);
            return response.ok(res, { message: n_p ? "Job Accepted" : "Job applied!" });
        } catch (error) {
            return response.error(res, error);
        }
    },

    assign: async (req, res) => {
        try {
            let job = await Job.findById(req.params["job_id"]);
            if (!job) return response.notFound(res, { message: "Job does not exist." });

            job.applicant.push(...req.body.applicant);
            await job.save();
            for (let u of req.body.applicant) {
                notification.push(u, "You have been assigned a job.");
            }
            return response.ok(res, { message: "Job assigned!" });
        } catch (error) {
            return response.error(res, error);
        }
    },

    historyProvider: async (req, res) => {
        try {
            let filter = req.params["filter"];
            let cond = {};
            let d = new Date();
            let de = new Date();

            if (filter == '1_WEEK') {
                cond = { startDate: { $gt: d.setDate(d.getDate() - 7), $lt: de.getTime() } };
            }
            if (filter == '2_WEEK') {
                cond = { startDate: { $gt: d.setDate(d.getDate() - 14), $lt: de.getTime() } };
            }
            if (filter == '1_MONTH') {
                cond = { startDate: { $gt: d.setDate(d.getDate() - 30), $lt: de.getTime() } };
            }
            if (filter == '1_YEAR') {
                cond = { startDate: { $gt: d.setDate(d.getDate() - 365), $lt: de.getTime() } };
            }

            cond.applicant = req.user.id;
            let jobs = await Job.find(cond).lean();
            return response.ok(res, { jobs });
        } catch (error) {
            return response.error(res, error);
        }
    },
    // shown to USER(who posted jobs)
    history: async (req, res) => {
        try {
            let filter = req.params["filter"];
            let cond = {};
            let d = new Date();
            let de = new Date();

            if (filter == '1_WEEK') {
                cond = { startDate: { $gt: d.setDate(d.getDate() - 7), $lt: de.getTime() } };
            }
            if (filter == '2_WEEK') {
                cond = { startDate: { $gt: d.setDate(d.getDate() - 14), $lt: de.getTime() } };
            }
            if (filter == '1_MONTH') {
                cond = { startDate: { $gt: d.setDate(d.getDate() - 30), $lt: de.getTime() } };
            }
            if (filter == '1_YEAR') {
                cond = { startDate: { $gt: d.setDate(d.getDate() - 365), $lt: de.getTime() } };
            }
            cond.posted_by = req.user.id;
            let jobs = await Job.find(cond).lean();
            return response.ok(res, { jobs });
        } catch (error) {
            return response.error(res, error);
        }
    },
    jobEvents: async (req, res) => {
        try {
            const job = Job.findById(req.body.job_id).lean();
            notification.push(job.posted_by, `${req.user.user} ${req.body.event.toLowerCase()} your job ${job.title}.`);
            return response.ok(res, { event: req.body.event });
        } catch (error) {
            return response.error(res, error);
        }
    },
    formatedJobs: async (req, res) => {
        try {
            let cond = {
                endDate: { $gte: new Date(req.body.startDate).getTime(), $lt: new Date(req.body.endDate).getTime() },
                startDate: { $gte: new Date(req.body.startDate).getTime(), $lt: new Date(req.body.endDate).getTime() }
            }
            const jobs = await Job.find(cond).populate('posted_by', 'username fullName').lean();
            let invites = await JobInvite.find({ job: { $in: jobs.map(j => j._id) } }).lean();

            let obj = {};
            invites.map(i => {
                if (obj[i.job]) {
                    obj[i.job].push(i);
                } else {
                    obj[i.job] = [i];
                }
            });

            let formattedJobs = {};
            jobs.map(j => {
                j.invites = obj[j._id];
                if (formattedJobs[j.posted_by.username]) {
                    formattedJobs[j.posted_by.username].push(j);
                } else {
                    formattedJobs[j.posted_by.username] = [j];
                }
            });
            let jjobs = [];
            Object.keys(formattedJobs).map(u => {
                let obj = {
                    name: u, jobs: formattedJobs[u]
                }
                jjobs.push(obj);
            });

            return response.ok(res, { jobs: jjobs });
        } catch (error) {
            return response.error(res, error);
        }
    },
    rejectInvite: async (req, res) => {
        try {
            await JobInvite.updateOne({ job: req.params["job_id"] }, { $set: { status: 'REJECTED' } });
            return response.ok(res, { message: "Rejected Invite." });
        } catch (error) {
            return response.error(res, error);
        }
    },
    //////////Surya's code - Please be careful ///////
    historyUserSearch: async (req, res) => {
        try {
            const cond = {
                $or: [{ title: { $regex: req.body.search } },
                { type: { $regex: req.body.search } },
                ]
            }
            cond.posted_by = req.user.id;
            let guards = await Job.find(cond).lean();
            return response.ok(res, { guards });
        } catch (error) {
            return response.error(res, error);
        }
    },

    saveMatch: async (req, res) => {
        try {
            const matchDetails = req.body;
            let match = new Match(matchDetails);
            // match.seriesName = new Date(jobDetails.startDate);
            // match.teamA = new Date(jobDetails.endDate);
            // match.teamB = new Date(jobDetails.endDate);
            match.startDate = new Date(matchDetails.startDate);
            match.endDate = new Date(matchDetails.endDate);
            //match.location = new Date(jobDetails.endDate);

            await match.save();
            return response.ok(res, { id: match._id, message: "Match created!" });
        } catch (error) {
            return response.error(res, error);
        }
    },

    getAllMatchs: async (req, res) => {
        try {
            let matchList = await Match.find().lean().sort({ createdAt: -1 });
            return response.ok(res, { matchList });
        } catch (error) {
            return response.error(res, error);
        }
    },

    createPrediction: async (req, res) => {
        try {
            let data = req.body;
            const match = await Match.findByIdAndUpdate(data.id, req.body);
            return response.ok(res, { message: "Match updated!==>>" });
        } catch (error) {
            return response.error(res, error);
        }
    },

    createNews: async (req, res) => {
        try {
            const newsDetails = req.body;
            let news = new News(newsDetails);
            news.date = new Date(newsDetails.date);
            await news.save();
            return response.ok(res, { id: news._id, message: "News created!" });
        } catch (error) {
            return response.error(res, error);
        }
    },

    getAllNews: async (req, res) => {
        try {
            let newsList = await News.find().lean();
            return response.ok(res, { newsList });
        } catch (error) {
            return response.error(res, error);
        }
    },

    saveOtherInfo: async (req, res) => {
        try {
            const otherDetails = req.body;
            let otherinfo = new OtherInfo(otherDetails);
            await otherinfo.save();
            return response.ok(res, { id: otherinfo._id, message: "otherinfo created!" });
        } catch (error) {
            return response.error(res, error);
        }
    },

    getAllOtherInfo: async (req, res) => {
        try {
            let info = await OtherInfo.find().lean();
            return response.ok(res, { info });
        } catch (error) {
            return response.error(res, error);
        }
    },

    updateInfo: async (req, res) => {
        try {
            let data = req.body;
            const match = await Match.findByIdAndUpdate(data.id, req.body);
            return response.ok(res, { message: "Score updated!==>>" });
        } catch (error) {
            return response.error(res, error);
        }
    },

    deleteMatch: async (req, res) => {
        try {
            let data = req.body;
            const match = await Match.deleteOne({ _id: data.id });
            return response.ok(res, { message: "Data Deleted!==>>" });
        } catch (error) {
            return response.error(res, error);
        }
    },
    deleteNews: async (req, res) => {
        try {
            let data = req.body;
            const news = await News.deleteOne({ _id: data.id });
            return response.ok(res, { message: "Data Deleted!==>>", news });
        } catch (error) {
            return response.error(res, error);
        }
    },
    // uploadTeam: async (req, res) => {
    //     try {
    //         let data = req.body;
    //         const match = await Match.findByIdAndUpdate(data.id, req.body);
    //         return response.ok(res, { message: "Score updated!==>>" });
    //     } catch (error) {
    //         return response.error(res, error);
    //     }
    // },
    uploadTeam: async (req, res) => {
        // console.log('Came in upload team');
        try {
            let key = req.file && req.file.key, id = req.body.id;
            let match = await Match.findOne({ _id: id });
            if (!match) {
                match = new Match({ key });
            }
            if (key) {
                match.key = `${process.env.ASSET_ROOT}/${key}` //update file location
            }
            await match.save();
            return response.ok(res, { message: "File uploaded.", file: `${process.env.ASSET_ROOT}/${key}` });
        } catch (error) {
            return response.error(res, error);
        }
    },
    saveNewsWithImg: async (req, res) => {
        try {
            const newsDetails = req.body;
            let news = new News(newsDetails);
            news.date = new Date(newsDetails.date);
            let key = req.file && req.file.key;
            if (key)
                //news.image = key;
                news.img = `${process.env.ASSET_ROOT}/${key}` //update file location
            await news.save();
            return response.ok(res, { id: news, message: "News created!" });
        } catch (error) {
            return response.error(res, error);
        }
    },

    saveSeries: async (req, res) => {
        try {
            const seriesDetails = req.body;
            let series = new Series(seriesDetails);
            series.startDate = new Date(seriesDetails.startDate);
            series.endDate = new Date(seriesDetails.endDate);
            await series.save();
            return response.ok(res, { id: series._id, message: "series created!" });
        } catch (error) {
            return response.error(res, error);
        }
    },

    getAllSeries: async (req, res) => {
        try {
            let seriesList = await Series.find().lean().sort({ createdAt: -1 });
            return response.ok(res, { seriesList });
        } catch (error) {
            return response.error(res, error);
        }
    },


}