import express from "express"
import db from "./db.js";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import passport from "passport";
import session from "express-session";
import FileStoreWrapper from "session-file-store"
var FileStore = FileStoreWrapper(session);
import { Strategy } from "passport-local";
import flash from "express-flash-message";

import env from "dotenv";

import {
  getMemberById,
  getMemberDuesById,
  getMembers,
  fetchNewMembers,
  fetchTotalMembers,
  fetchTotalMembersYear,
  addNewMember,
  recordDues,
  removeDues,
  updateMemberInformation,
  deleteMember,
  fetchMemberEvents,
  fetchEventMembers,
} from "./memberQueries.js";

import {
  fetchAllEvents,
  fetchEventById,
  fetchEventMoneyRaised,
  fetchEventMonthlyCosts,
  fetchYearlyEventCosts,
  fetchYearlyMoneyRaised,
  insertEvent,
  updateEvent,
  deleteEvent,
  fetchNewEvents,
  fetchEventByName,
  addEventAttendees,
  fetchEventAttendees,
  updateEventAttendees,
  deleteEventAttendees,
} from "./eventQueries.js";

import {
  fetchAllOrganizations,
  fetchOrganizationCount,
  fetchSpecificOrganization,
  fetchOrganizationByName,
  addOrganization,
  updateOrganization,
  deleteOrganization,
} from "./organizationQueries.js";

import {
  fetchDonationInflows,
  fetchDonationInflowById,
  updateDonationInflow,
  deleteDonationInflow,
  addDonationInflow,
  getDonationInflowByName,
  fetchDonationInflowsTotal,
  fetchNewInflows,
} from "./donationInflowQueries.js";

import {
  fetchDonationOutflows,
  fetchDonationOutflowById,
  updateDonationOutflow,
  deleteDonationOutflow,
  addDonationOutflow,
  getDonationOutflowByName,
  fetchDonationOutflowsTotal,
  fetchNewOutflows,
} from "./donationOutflowQueries.js";


const app = express();
const port = 3000;
const saltRounds = 10;

app.use(express.json());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs"); // Set the view engine to EJS
env.config();

let fileStoreOptions = {};
app.use(
  session({
    secret: process.env.SECRET,
    store: new FileStore(fileStoreOptions),
    resave: false,
    saveUninitialized: true,
    cookie: {
      //  days, hours, min, sec, ms
      maxAge: 7 * 24 * 60 * 60 * 1000,
    }
  })
);

// setup flash messages
app.use( flash({ sessionKeyName: 'express-flash-message', }));

app.use(passport.initialize());
app.use(passport.session());

// authenticate every route
app.use(function(req, res, next) {
  let route = `${req.baseUrl}${req.path}`
  let exclude_routes = ["/login","/favicon.ico"]
  if (req.isAuthenticated() || exclude_routes.includes(route)) 
    return next();
  else
    res.redirect('/login')
});

async function hashPassword(password) {
  return await bcrypt.hash(password, saltRounds);
}

// Complete
app.get("/", (req, res) => {
    res.render("index.ejs");
});

app.get("/logout", async (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

app.get("/login", async (req, res) => {
  try {
    res.render("login.ejs", {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post( "/login", passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
  })
);

app.post("/updatePassword/:memberID", async (req, res) => {
  const currentPass = req.body.currentPass;
  const newPass = req.body.newPass;
  const confirmPass = req.body.confirmPass;
  const memberID = req.params.memberID;

  // Passwords don't match. Should check this client-side as well.
  if (newPass !== confirmPass) {
    res.flash("failure","Password confirmation doesn't match new password.")
    res.redirect(`/members/${memberID}`);
    return;
  }
  const loggedInUser = await db.get("SELECT password FROM member WHERE memberID = ?", [ req.user.memberID ]);

  // No logged in user found, or there's not a valid password somehow
  if (!loggedInUser || !loggedInUser.password) {
    res.flash("failure","No logged in user (somehow).")
    res.redirect(`/members/${memberID}`);
    return;
  }

  // check logged in user's password and if successful, update the member's password
  bcrypt.compare(currentPass, loggedInUser.password, async (err, result) => {
    if (err) {
      console.log(err);
      res.flash("failure","Unknown error changing passwords");
      res.redirect(`/members/${memberID}`);
      return;

    } else {
      if (result) {
        // hash password and set for user
        let newHash = await hashPassword(newPass);
        await db.run(`UPDATE member SET password=? WHERE memberID=?`,[newHash,memberID])

        res.flash("success","Password changed successfully!");
        res.redirect(`/members/${memberID}`);
        return;

      } else {
        res.flash("failure","Incorrect authorization password.");
        res.redirect(`/members/${memberID}`);
        return;
      }
    }
  });
});

app.get("/members", async (req, res) => {
  try {
    res.render("members.ejs", { members: await getMembers() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Complete
app.post("/members/dues", async (req, res) => {
  const year = req.body.year;
  const status = req.body.status;
  try {
    const result = await getMemberDues(year, status);
    res.render("members.ejs", { members: result });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Complete
app.post("/members/newMembers", async (req, res) => {
  const year = req.body.year;
  try {
    const members = await fetchNewMembers(year);
    res.render("members.ejs", { members, });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/members/addMember", (req, res) => {
  try {
    res.render("addMember.ejs");
  } catch (error) {
    console.error(error);
    res.status(500);
  }
});

app.post("/members/newMemberForm", async (req, res) => {
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const email = req.body.email;
  const phone = req.body.phone;
  const street = req.body.street;
  const city = req.body.city;
  const state = req.body.state;
  const zip = req.body.zip;
  const dateOfBirth = req.body.dateOfBirth;
  const dateJoined = req.body.dateJoined;
  const membershipType = req.body.membershipType;

  const newMember = {
    firstName: firstName,
    lastName: lastName,
    email: email,
    phone: phone,
    street: street,
    city: city,
    state: state,
    zip: zip ? zip : null,
    dateOfBirth: dateOfBirth ? dateOfBirth : null,
    dateJoined: dateJoined ? dateJoined : null,
    membershipType: membershipType,
  };
  console.log(newMember);


  try {
    const memberId = await addNewMember(newMember);

    const duesFor = req.body.duesFor;
    const paymentDate = !req.body.paymentDate ? null : req.body.paymentDate;
    if(paymentDate) {
      await recordDues(memberId, duesFor, paymentDate, req.user.memberID);
    }

    res.redirect(`/members/${memberId}`);

  } catch (error) {
    console.error("Error adding member and membership fee:", error);
    res.status(500).send("Error adding member and membership fee");
  }
});

// Complete
app.get("/members/:memberId", async (req, res) => {
  const memberId = req.params.memberId;
  if (/^\d+$/.test(memberId)) { // make sure it's a number
    const member = await getMemberById(memberId);
    console.log(member)
    if (member) {
      if (member.dateofbirth) {
        const unformattedDateOfBirth = new Date(member.dateofbirth);
        member.dateofbirth = unformattedDateOfBirth.toISOString().substring(0, 10);
      }

      if (member.datejoined) {
        const unformattedDateJoined = new Date(member.datejoined);
        member.datejoined = unformattedDateJoined.toISOString().substring(0, 10);
      }

      const memberDues = await getMemberDuesById(memberId);
      res.render("member.ejs", {
        member: member,
        dues: memberDues,
        currentUser: req.user,
      });
      
    } else {
      res.status(404).send("Invalid Member ID");
    }
  } else {
    res.status(404).send("Page Not Found");
  }
});

app.post("/updatedMemberInfo/:memberId", async (req, res) => {
  const memberId = req.params.memberId;
  const {
    firstName,
    lastName,
    email,
    phone,
    street,
    city,
    state,
    zip,
    dateOfBirth,
    dateJoined,
    membershipType,
  } = req.body;

  const newMember = {
    memberId: memberId,
    firstName: firstName,
    lastName: lastName,
    email: email,
    phoneNumber: phone,
    streetName: street,
    city: city,
    usState: state,
    zipCode: zip ? zip : null,
    dateOfBirth: dateOfBirth ? dateOfBirth : null,
    dateJoined: dateJoined ? dateJoined : null,
    memberType: membershipType,
  };

  try {
    await updateMemberInformation(newMember);
    res.redirect(`/members/${memberId}`);

  } catch (error) {
    console.error("Error updating the member:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Complete
app.get("/removeDues/:memberId/:duesFor", async (req, res) => {
  const memberId = req.params.memberId;
  const duesFor = req.params.duesFor;
  await removeDues(memberId, duesFor);
  res.redirect(`/members/${memberId}`);
});

app.post("/recordDues/:memberId", async (req, res) => {
  const memberId = req.params.memberId;
  const duesFor = req.body.duesFor;
  let paymentDate = req.body.paymentDate;
  paymentDate = !paymentDate ? null : paymentDate; // This sets paymentDate to null if it is either an empty string, undefined, or null
  await recordDues(memberId, duesFor, paymentDate, req.user.memberID);
  res.redirect(`/members/${memberId}`);
});

// Complete
app.post("/deleteMember/:memberId", async (req, res) => {
  const memberId = req.params.memberId;
  console.log(memberId);
  try {
    await deleteMember(memberId);
    res.redirect("/members");
  } catch (error) {
    console.error("Error deleting the member:", error);
    res.status(500).send("Internal Server Error");
  }
});

// -----------------------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------------
// organization route handlers

// Complete
app.get("/organizations", async (req, res) => {
  try {
    const organizations = await fetchAllOrganizations();
    // const numOrganization = await fetchOrganizationCount();
    res.render("organizations.ejs", { organizations });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

// Complete
app.get("/organizations/searchOrganization", async (req, res) => {
  const searchTerm = req.query.searchTerm.trim();
  try {
    const organizations = await fetchOrganizationByName(searchTerm);
    res.render("organizations.ejs", { organizations });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

// Complete
app.get("/organizations/addOrganization", async (req, res) => {
  res.render("addOrganization.ejs");
});

app.post("/organizations/newOrgForm", async (req, res) => {
  const organizationName = req.body.organizationName;
  const organizationType = req.body.organizationType;
  const street = req.body.street;
  const city = req.body.city;
  const state = req.body.state;
  const zip = req.body.zip;
  const email = req.body.email;
  const phoneNumber = req.body.phoneNumber;

  const newOrg = {
    organizationName: organizationName,
    organizationType: organizationType,
    streetName: street,
    city: city,
    usState: state,
    zipCode: zip ? zip : null,
    email: email,
    phoneNumber: phoneNumber,
  };

  try {
    // Step 1: Insert the new event
    await addOrganization(newOrg);
    res.flash("success","Organization successfully added!")

  } catch (error) {
    console.error("Error adding organization", error);
    res.flash("failures","Error adding organization")
  }

  res.redirect("/organizations");
});

// route to each organization
app.get("/organizations/:organizationId", async (req, res) => {
  const organizationId = req.params.organizationId;
  // Check if organizationId is a string of digits
  if (/^\d+$/.test(organizationId)) {
    const result = await fetchSpecificOrganization(organizationId);
    if (result.length > 0) {
      res.render("organization.ejs", {
        organization: result[0],
      });
    } else {
      res.status(404).send("Invalid Organization ID");
    }
  } else {
    res.status(404).send("Page Not Found");
  }
});

// Complete
app.post("/updateOrganizationInfo/:organizationId", async (req, res) => {
  const orgId = req.params.organizationId;

  const {
    organizationName,
    organizationType,
    email,
    phoneNumber,
    street,
    city,
    state,
    zip,
  } = req.body;

  const orgData = {
    organizationName: organizationName,
    organizationType: organizationType,
    email: email,
    phoneNumber: phoneNumber,
    streetName: street,
    city: city,
    usState: state,
    zipCode: zip ? zip : null,
  };

  console.log(orgData);

  try {
    await updateOrganization(orgId, orgData);
    res.redirect(`/organizations/${orgId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

// Complete
app.post("/deleteOrganization/:organizationId", async (req, res) => {
  try {
    await deleteOrganization(req.params.organizationId);
    res.flash("success","Organization successfully deleted!")

  } catch (error) {
    console.error(error);
    res.flash("failure","Unknown error")
  }
  res.redirect("/organizations");
});

// --------------------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------------
// event handlers

app.get("/events", async (req, res) => {
  try {
    const events = await fetchAllEvents();
    console.log(events)
    res.render("events.ejs", { events });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

app.get("/events/searchEvent", async (req, res) => {
  const searchTerm = req.query.searchTerm;
  try {
    const events = await fetchEventByName(searchTerm);
    console.log(events);
    if (events.length > 0) {
      res.render("events.ejs", { events: events });
    } else {
      res.render("events.ejs", { events: [] });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

// Complete
app.get("/events/addEvent", async (req, res) => {
  try {
    const members = await getMembers();
    res.render("addEvent.ejs", { members });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

// event stats route
app.get("/events/eventStats", async (req, res) => {
  try {
    const stats = await fetchEventMoneyRaised();
    console.log(stats);
    res.render("eventStats.ejs", { stats });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

app.post("/events/newEventForm", async (req, res) => {
  const eventName = req.body.eventName;
  const location = req.body.location;
  const street = req.body.street;
  const city = req.body.city;
  const state = req.body.state;
  const zip = req.body.zip;
  const eventDate = req.body.eventDate;
  const eventType = req.body.eventType;
  const cost = req.body.cost;
  const amountRaised = req.body.amountRaised;
  const attendees = req.body.attendeeIds;

  const newEvent = {
    eventName: eventName,
    eventLocation: location,
    streetName: street,
    city: city,
    usState: state,
    zipCode: zip ? zip : null,
    eventDate: eventDate ? eventDate : null,
    eventType: eventType,
    eventCost: (cost && cost >= 0) ? cost : null,
    amountRaised: amountRaised,
  };

  console.log("New Event Values")
  console.log(newEvent)

  try {
    // Step 1: Insert the new event
    const event = await insertEvent(newEvent);
    if (attendees && attendees.length > 0) {
      for (let i = 0; i < attendees.length; i++) {
        await addEventAttendees(event.eventID, attendees[i]);
      }
    }

    res.redirect("/events");
  } catch (error) {
    console.error("Error adding event", error);
    res.status(500).send("Error adding event");
  }
});

// new events route
app.post("/events/newEvents", async (req, res) => {
  const year = req.body.year;
  console.log(year);

  try {
    const events = await fetchNewEvents(year);
    res.render("events.ejs", {
      events,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

// route to each event
app.get("/events/:eventId", async (req, res) => {
  const eventId = req.params.eventId;
  if (/^\d+$/.test(eventId)) {
    const result = await fetchEventById(eventId);
    if (result.length > 0) {
      const finalResult = result[0];
      if(finalResult.eventdate) {
        const newDate = new Date(finalResult.eventdate);
        finalResult.eventdate = newDate.toISOString().substring(0, 10);
      }

      const allMembers = await getMembers();
      const attendees = await fetchEventAttendees(eventId);

      res.render("event.ejs", {
        event: finalResult,
        members: allMembers,
        attendees: attendees,
      });
    } else {
      res.status(404).send("Invalid Event ID");
    }
  } else {
    res.status(404).send("Page Not Found");
  }
});

app.post("/events/:eventId/addAttendees", async (req, res) => {
  const eventId = req.params.eventId;
  const attendees = req.body.attendeeIds;

  try {
    await deleteEventAttendees(eventId);
    if (attendees && attendees.length > 0) {
      for (let i = 0; i < attendees.length; i++) {
        await addEventAttendees(eventId, attendees[i]);
      }
    }
    res.redirect(`/events/${eventId}`);

  } catch (error) {
    console.error("Error updating the event:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/updateEventInfo/:eventId", async (req, res) => {
  const eventId = req.params.eventId;
  console.log(eventId);
  const {
    eventName,
    location,
    street,
    city,
    state,
    zip,
    eventDate,
    eventCost,
    amountRaised,
    eventType,
  } = req.body;

  const newEvent = {
    eventName: eventName,
    eventLocation: location,
    streetName: street,
    city: city,
    usState: state,
    zipCode: zip ? zip : null,
    eventDate: eventDate ? eventDate : null,
    eventType: eventType,
    eventCost: Number(eventCost) ? eventCost >= 0 : null,
    amountRaised: Number(amountRaised),
  };

  // console.log(newEvent);

  const attendees = req.body.attendeeIds;
  console.log(attendees);

  try {
    await updateEvent(eventId, newEvent);
    await deleteEventAttendees(eventId);
    if (attendees && attendees.length > 0) {
      for (let i = 0; i < attendees.length; i++) {
        await addEventAttendees(eventId, attendees[i]);
      }
    }
    res.redirect(`/events/${eventId}`);
  } catch (error) {
    console.error("Error updating the event:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/deleteEvent/:eventId", async (req, res) => {
  const eventId = req.params.eventId;
  console.log(eventId);
  try {
    await deleteEvent(eventId);
    res.redirect("/events");
  } catch (error) {
    console.error("Error deleting the event:", error);
    res.status(500).send("Internal Server Error");
  }
});

// ---------------------------------------------------------------------------------

app.get("/donationInflows", async (req, res) => {
  try {
    const donationInflows = await fetchDonationInflows();
    res.render("donationInflows.ejs", {
      donationInflows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

app.post("/donationInflows/newInflows", async (req, res) => {
  const year = req.body.year;
  console.log(year);
  try {
    const donationInflows = await fetchNewInflows(year);
    res.render("donationInflows.ejs", {
      donationInflows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

app.get("/donationInflows/inflowStats", async (req, res) => {
  try {
    const stats = await fetchDonationInflowsTotal();
    res.render("donationInflowStats.ejs", { stats });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

app.get("/donationInflows/addDonationInflow", async (req, res) => {
  const orgs = await fetchAllOrganizations();
  const members = await getMembers('firstname');

  res.render("addInflow.ejs", { orgs: orgs, members: members });
});

app.post("/donationInflows/create", async (req, res) => {
  const { recordName, donor, donorInput, donorType, category, amount, donationDate } =
    req.body;
  const newDonor = {
    recordName: recordName,
    donor: req.body.donor,
    donorInput: req.body.donorInput,
    donorType: req.body.donorType,
    category: category,
    amount: amount,
    donationDate: donationDate,
  };

  try {
    await addDonationInflow(newDonor);
    res.flash("success","Donation inflow successfully added")
    res.redirect("/donationInflows");
  } catch (err) {
    console.log("failure");
  }
});

app.get("/donationInflows/searchInflow", async (req, res) => {
  const searchTerm = req.query.searchTerm;
  console.log(searchTerm);
  try {
    const donationInflows = await getDonationInflowByName(searchTerm);
    if (donationInflows.length > 0) {
      res.render("donationInflows.ejs", { donationInflows });
    } else {
      res.render("donationInflows.ejs", { donationInflows: [] });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

app.get("/donationInflows/:donationInflowId", async (req, res) => {
  const inflowId = req.params.donationInflowId; // Retrieve the ID from the query parameters
  if (/^\d+$/.test(inflowId)) {
    try {
      const result = await fetchDonationInflowById(inflowId);
      if (result.length > 0) {
        const finalResult = result[0];
        const newDate = new Date(finalResult.donationdate);
        finalResult.donationdate = newDate.toISOString().substring(0, 10);
        const orgs = await fetchAllOrganizations();
        const members = await getMembers();
        let donor;
        if (finalResult.organizationid && !finalResult.memberid) {
          donor = finalResult.organizationname;
        } else if (finalResult.memberid && !finalResult.organizationid) {
          donor = finalResult.firstname + " " + finalResult.lastname;
        } else {
          donor = finalResult.createddonor;
        }

        res.render("inflow.ejs", { donation: finalResult, orgs: orgs, members: members, donor: donor}); // Pass only the first element
      } else {
        res.status(404).send("Invalid Donation Inflow ID");
      }

      // Render the template with the fetched entity information
    } catch (error) {
      console.error("Error fetching donation inflow:", error);
      res.render("error", { message: "An error occurred" });
    }
  } else {
    res.status(404).send("Page Not Found");
  }
});

app.post("/updateDonationInflow/:donationInflowId", async (req, res) => {
  const inflowId = req.params.donationInflowId;

  const { recordName, donor, donorType, category, amount, donationDate } =
    req.body;
    
  const updatedRecord = {
    recordName: recordName,
    donor: req.body.donor,
    donorInput: req.body.donorInput,
    donorType: req.body.donorType,
    category: category,
    amount: amount,
    donationDate: donationDate,
  };

  try {
    await updateDonationInflow(inflowId, updatedRecord);
    res.redirect("/donationInflows");
  } catch (error) {
    console.error("Error executing update query", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/deleteInflow/:donationInflowId", async (req, res) => {
  const inflowId = req.params.donationInflowId;
  console.log(inflowId);

  try {
    await deleteDonationInflow(inflowId);
    res.redirect("/donationInflows");
  } catch (error) {
    console.error("Error executing delete query", error);
    res.status(500).send("Internal Server Error");
  }
});

// ----------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------

app.get("/donationOutflows", async (req, res) => {
  try {
    const donationOutflows = await fetchDonationOutflows();
    res.render("donationOutflows.ejs", { donationOutflows });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

app.get("/donationOutflows/addOutflow", async (req, res) => {
  const orgs = await fetchAllOrganizations();
  const members = await getMembers('firstname');
  res.render("addOutflow.ejs", { orgs: orgs, members: members });
});

app.post("/donationOutflows/newOutflows", async (req, res) => {
  const year = req.body.year;
  try {
    const donationOutflows = await fetchNewOutflows(year);
    res.render("donationOutflows.ejs", {
      donationOutflows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

app.get("/donationOutflows/outflowStats", async (req, res) => {
  try {
    const stats = await fetchDonationOutflowsTotal();
    console.log(stats);
    res.render("donationOutflowStats.ejs", { stats });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

app.post("/donationOutflows/create", async (req, res) => {
  const { recordName, organization, category, amount, donationDate, contactPerson } =
    req.body;
  const newOrg = {
    recordName: recordName,
    organization: organization,
    contactPerson: contactPerson,
    category: category,
    amount: amount,
    donationDate: donationDate,
  };
  console.log(newOrg);
  try {
    await addDonationOutflow(newOrg);
    res.flash("Success","Donation outflow successfully created.")
    res.redirect("/donationOutflows");
  } catch (err) {
    console.log("failure");
  }
});

app.get("/donationOutflows/searchOutflow", async (req, res) => {
  const searchTerm = req.query.searchTerm;
  console.log(searchTerm);
  try {
    const donationOutflows = await getDonationOutflowByName(searchTerm);
    if (donationOutflows.length > 0) {
      res.render("donationOutflows.ejs", { donationOutflows });
    } else {
      res.render("donationOutflows.ejs", { donationOutflows: [] });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

app.get("/donationOutflows/:donationOutflowId", async (req, res) => {
  const outflowId = req.params.donationOutflowId; // Retrieve the ID from the query parameters
  if (/^\d+$/.test(outflowId)) {
    try {
      const result = await fetchDonationOutflowById(outflowId);
      if (result.length > 0) {
        const finalResult = result[0];
        const newDate = new Date(finalResult.donationdate);
        finalResult.donationdate = newDate.toISOString().substring(0, 10);
        console.log("last checked is ", finalResult)
        const orgs = await fetchAllOrganizations();
        res.render("outflow.ejs", { donation: finalResult, orgs: orgs }); // Pass only the first element
      } else {
        res.status(404).send("Invalid Donation Outflow ID");
      }

      // Render the template with the fetched entity information
    } catch (error) {
      console.error("Error fetching donation outflow:", error);
      res.render("error", { message: "An error occurred" });
    }
  } else {
    res.status(404).send("Page Not Found");
  }
});

app.post("/updateDonationOutflow/:donationOutflowId", async (req, res) => {
  const OutflowId = req.params.donationOutflowId;
  console.log(OutflowId);
  const { recordName, organization, contactPerson, category, amount, donationDate } =
    req.body;
  const updatedRecord = {
    recordName: recordName,
    organizationID: organization,
    contactPerson: contactPerson,
    category: category,
    amount: amount,
    donationDate: donationDate,
  };
  console.log(updatedRecord);
  try {
    await updateDonationOutflow(OutflowId, updatedRecord);
    res.redirect("/donationOutflows");
  } catch (error) {
    console.error("Error executing update query", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/deleteOutflow/:donationOutflowId", async (req, res) => {
  const OutflowId = req.params.donationOutflowId;
  console.log(OutflowId);

  try {
    await deleteDonationOutflow(OutflowId);
    res.redirect("/donationOutflows");
  } catch (error) {
    console.error("Error executing delete query", error);
    res.status(500).send("Internal Server Error");
  }
});

passport.serializeUser((user, cb) => {
  cb(null, {memberID: user.memberID});
});

passport.deserializeUser(async (user, cb) => {
  cb(null, await db.get("SELECT memberID FROM member WHERE memberID=?",[user.memberID]));
});

passport.use(
  new Strategy(async function verify(username, password, cb) {
    // username and password are auto grabbed from our frontend.

    try {
      const user = await db.get("SELECT * FROM member WHERE email = ?", [ username ]);
      if (user) {
        const storedHashedPassword = user.password;
        bcrypt.compare(password, storedHashedPassword, (err, result) => {
          if (err) {
            console.log("Unknown bcrypt error")
            return cb(err);
          } else {
            if (result) {
              console.log(`Login succesful for ${user.firstName} ${user.lastName}`)
              return cb(null, {memberID: user.memberID});
            } else {
              console.log("Incorrect email or password")
              return cb(null, false, { message: 'Incorrect email or password.' });
            }
          }
        });
      } else {
        return cb("user not found");
      }
    } catch (err) {
      console.log(err)
      return cb("user not found");
    }
  })
);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
