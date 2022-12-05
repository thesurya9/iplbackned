'use strict';
const userHelper = require('./../helper/user');
const response = require('./../responses');
const passport = require('passport');
const jwtService = require("./../services/jwtService");
const mailNotification = require("./../services/mailNotification");
const mongoose = require("mongoose");
const Device = mongoose.model('Device');
const User = mongoose.model('User');
const Verification = mongoose.model('Verification');
const Notification = mongoose.model('Notification');
const Identity = mongoose.model('Identity');
const Client = mongoose.model('Client');

module.exports = {
    // login controller
    login: (req, res) => {
        passport.authenticate('local', async (err, user, info) => {
            if (err) { return response.error(res, err); }
            if (!user) { return response.unAuthorize(res, info); }
            //console.log('user=======>>',user);
            let token = await new jwtService().createJwtToken({ id: user._id, email: user.email });
            //await Device.updateOne({ device_token: req.body.device_token }, { $set: { player_id: req.body.player_id, user: user._id } }, { upsert: true });
            return response.ok(res, { token, email: user.email, id: user._id, fullName: user.fullName });
        })(req, res);
    },
    signUp: async (req, res) => {
        try {
            const payload = req.body;
            let user = await User.find({ email: payload.email.toLowerCase() }).lean();
            if (!user.length) {
                // let user = await User.findOne({ email: payload.email.toLowerCase()  }).lean();
                // if (!user) {
                let user = new User({
                    // username: payload.username.toLowerCase(),
                    password: payload.password,
                    type: payload.type,
                    email: payload.email.toLowerCase(),
                    fullName: payload.fullName
                });
                user.password = user.encryptPassword(req.body.password);
                await user.save();
                // let token = await new jwtService().createJwtToken({ id: user._id, email: user.username });
                return response.created(res, { email: user.email });
            } else {
                return response.conflict(res, { message: "username or email already exists." });
            }
        } catch (error) {
            return response.error(res, error);
        }
    },
    changePasswordProfile: async (req, res) => {
        try {
            let user = await User.findById(req.user.id);
            if (!user) {
                return response.notFound(res, { message: "User doesn't exists." });
            }
            user.password = user.encryptPassword(req.body.password);
            await user.save();
            mailNotification.passwordChange({ email: user.email });
            return response.ok(res, { message: "Password changed." });
        } catch (error) {
            return response.error(res, error);
        }
    },
    me: async (req, res) => {
        try {
            let [user, identity] = await Promise.all([userHelper.find({ _id: req.user.id }).lean(), Identity.find({ user: req.user.id }).lean()]);
            user.identity = identity.map(i => {
                i.image = `${process.env.ASSET_ROOT}/${i.key}`
                return i;
            });
            return response.ok(res, user);
        }
        catch (error) {
            return response.error(res, error);
        }
    },
    updateUser: async (req, res) => {
        try {
            delete req.body.password;
            await User.updateOne({ _id: req.user.id }, { $set: req.body });
            return response.ok(res, { message: "Profile Updated." });
        }
        catch (error) {
            return response.error(res, error);
        }
    },
    sendOTP: async (req, res) => {
        try {
            const email = req.body.email;
            if (!email) {
                return response.badReq(res, { message: "Email required." });
            }
            const user = await User.findOne({ email });
            if (user) {
                let ver = await Verification.findOne({ user: user._id });
                // OTP is fixed for Now: 0000
                let ran_otp = Math.floor(1000 + Math.random() * 9000);
                await mailNotification.sendOTPmail({ code: ran_otp, email: user.email });
                // let ran_otp = '0000';
                if (!ver || new Date().getTime() > new Date(ver.expiration_at).getTime()) {
                    ver = new Verification({ user: user._id, otp: ran_otp, expiration_at: userHelper.getDatewithAddedMinutes(5) });
                    await ver.save();
                }
                let token = await userHelper.encode(ver._id);

                return response.ok(res, { message: "OTP sent.", token });
            } else {
                return response.notFound(res, { message: "User does not exists." });
            }
        } catch (error) {
            return response.error(res, error);
        }
    },
    verifyOTP: async (req, res) => {
        try {
            const otp = req.body.otp;
            const token = req.body.token;
            if (!(otp && token)) {
                return response.badReq(res, { message: "otp and token required." });
            }
            let verId = await userHelper.decode(token);
            let ver = await Verification.findById(verId);
            if (otp == ver.otp && !ver.verified && new Date().getTime() < new Date(ver.expiration_at).getTime()) {
                let token = await userHelper.encode(ver._id + ":" + userHelper.getDatewithAddedMinutes(5).getTime());
                ver.verified = true;
                await ver.save();
                return response.ok(res, { message: "OTP verified", token });
            } else {
                return response.notFound(res, { message: "Invalid OTP" });
            }
        } catch (error) {
            return response.error(res, error);
        }
    },
    changePassword: async (req, res) => {
        try {
            const token = req.body.token;
            const password = req.body.password;
            const data = await userHelper.decode(token);
            const [verID, date] = data.split(":");
            if (new Date().getTime() > new Date(date).getTime()) {
                return response.forbidden(res, { message: "Session expired." });
            }
            let otp = await Verification.findById(verID);
            if (!otp.verified) {
                return response.forbidden(res, { message: "unAuthorize" });
            }
            let user = await User.findById(otp.user);
            if (!user) {
                return response.forbidden(res, { message: "unAuthorize" });
            }
            await otp.remove();
            user.password = user.encryptPassword(password);
            await user.save();
            mailNotification.passwordChange({ email: user.email });
            return response.ok(res, { message: "Password changed! Login now." });
        } catch (error) {
            return response.error(res, error);
        }
    },
    notification: async (req, res) => {
        try {
            let notifications = await Notification.find({ for: req.user.id }).populate({
                path: 'invited_for',
                populate: { path: 'job' }
            }).lean();
            return response.ok(res, { notifications });
        } catch (error) {
            return response.error(res, error);
        }
    },
    updateSettings: async (req, res) => {
        try {
            await User.findByIdAndUpdate(req.user.id, { $set: req.body });
            return response.ok(res, { message: "Settings updated." });
        } catch (error) {
            return response.error(res, error);
        }
    },
    getSettings: async (req, res) => {
        try {
            const settings = await User.findById(req.user.id, { notification: 1, distance: 1 });
            return response.ok(res, { settings });
        } catch (error) {
            return response.error(res, error);
        }
    },
    fileUpload: async (req, res) => {
        try {
            let key = req.file && req.file.key, type = req.body.type;
            let ident = await Identity.findOne({ type, user: req.user.id });
            if (!ident) {
                ident = new Identity({ key, type, user: req.user.id });
            }
            if (key) {
                ident.key = key; //update file location
            }
            if (req.body.expire && type == 'SI_BATCH') {
                ident.expire = req.body.expire;
            }
            await ident.save();
            return response.ok(res, { message: "File uploaded.", file: `${process.env.ASSET_ROOT}/${key}` });
        } catch (error) {
            return response.error(res, error);
        }
    },
    allOrganization: async (req, res) => {
        try {
            const users = await userHelper.findAll({ isOrganization: true }).lean();
            return response.ok(res, { users });
        } catch (error) {
            return response.error(res, error);
        }

    },
    guardListWithIdentity: async (req, res) => {
        try {
            let cond = { type: 'PROVIDER' };
            if (req.body.search) {
                cond = {
                    type: 'PROVIDER',
                    $or: [
                        { username: { $regex: req.body.search } },
                        { email: { $regex: req.body.search } }
                    ]
                }
            }
            let guards = await userHelper.findAll(cond).lean();

            const ids = guards.map(a => a._id);
            const identity = await Identity.find({ user: { $in: ids } }).lean();
            const hash = {};
            identity.map(r => {
                if (hash[r.user]) {
                    hash[r.user].push(r);
                } else {
                    hash[r.user] = [r];
                }
            });
            guards.map(g => {
                g.identity = hash[g._id];
            });
            return response.ok(res, { guards });
        } catch (error) {
            return response.error(res, error);
        }
    },
    guardListSearch: async (req, res) => {
        try {
            const cond = {
                type: 'PROVIDER',
                $or: [
                    { username: { $regex: req.body.search } },
                    { email: { $regex: req.body.search } }
                ]
            }
            let guards = await User.find(cond).lean();
            return response.ok(res, { guards });
        } catch (error) {
            return response.error(res, error);
        }
    },
    //////////Inten Surya's code ---!!!caution!!!/////

    //GuardList

    verifyGuard: async (req, res) => {
        try {
            await User.updateOne({ email: req.body.email }, { $set: { verified: req.body.verified } });
            return response.ok(res, {
                message: req.body.verified ? "Guard Verified." : "Guard Suspended."
            });
        }
        catch (error) {
            return response.error(res, error);
        }
    },

    getStaffList: async (req, res) => {
        try {
            //let cond = { type: 'PROVIDER'};
            let guards = await User.find({ type: 'PROVIDER' }, { username: 1 })
            return response.ok(res, { guards });
        } catch (error) {
            return response.error(res, error);
        }
    },

    regNewClient: async (req, res) => {
        try {
            const payload = req.body;
            let client = new Client({
                fullName: payload.fullName,
                billingName: payload.billingName,
                rate: payload.rate,
                vat: payload.vat,
                address: payload.address,
                billingAddress: payload.billingAddress,
                email: payload.email,
                phoneNumber: payload.phoneNumber,
                clientRef: payload.clientRef,
                organization: req.user.id
            });
            await client.save();
            return response.ok(res, { message: "Client created!" });
        } catch (error) {
            return response.error(res, error);
        }
    },

    getAllClients: async (req, res) => {
        try {
            let cond = {};
            cond.organization = req.user.id;
            console.log('req.user.id--->', req.user.id);
            let clients = await Client.find(cond).lean();
            return response.ok(res, { clients });
        } catch (error) {
            return response.error(res, error);
        }
    }


};
