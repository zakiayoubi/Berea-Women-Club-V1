import express from "express"
import db from "./db.js";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import passport from "passport";
import session from "express-session";
import FileStoreWrapper from "session-file-store"
var FileStore = FileStoreWrapper(session);
import { Strategy } from "passport-local";

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
  sortOrganizations,
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
  sortInflows,
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
  sortOutflows,
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

// async function hashingPassword(password) {
//   try {
//       bcrypt.hash(password, saltRounds, async(err, hash) => {
//       if (err) {
//         console.log("Error hasing password", err);
//       } else {
//         console.log(hash);
//       }
//     });
//     } catch (err) {
//       console.log(err);
//     }
// }

// (async () => {
//   try {
//     await hashingPassword("123456");
//   } catch (err) {
//     console.error("An error occurred:", err);
//   }
// })();

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

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
  })
);

// Complete
app.get("/members", async (req, res) => {
  try {
    res.render("member.ejs", { members: await getMembers() });
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
    res.render("member.ejs", { members: result });

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
    res.render("member.ejs", { members, });

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
      res.render("memberInfo.ejs", {
        member: member,
        dues: memberDues,
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
    res.render("organization.ejs", { organizations });
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
    res.render("organization.ejs", { organizations });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

// Complete
app.get("/organizations/addOrganization", async (req, res) => {
  try {
    res.render("addOrganization.ejs");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

// sort org route
app.post("/organizations/sortOrg", async (req, res) => {
  const sortBy = req.body.sortBy;
  try {
    const result = await sortOrganizations(sortBy);
    res.render("organization.ejs", {
      organizations: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
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

    const result = await fetchAllOrganizations();
    res.render("organization.ejs", {
      organizations: result,
    });
  } catch (error) {
    console.error("Error adding organization", error);
    res.status(500).send("Error adding organization");
  }
});

// route to each organization
app.get("/organizations/:organizationId", async (req, res) => {
  const organizationId = req.params.organizationId;
  // Check if organizationId is a string of digits
  if (/^\d+$/.test(organizationId)) {
    const result = await fetchSpecificOrganization(organizationId);
    if (result.length > 0) {
      res.render("organizationInfo.ejs", {
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
  const orgId = req.params.organizationId;
  try {
    await deleteOrganization(orgId);
    res.redirect("/organizations");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
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
    res.render("event.ejs", { events });
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
      res.render("event.ejs", { events: events });
    } else {
      res.render("event.ejs", { events: [] });
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
    res.render("event.ejs", {
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

      res.render("eventInfo.ejs", {
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
    // console.log("here we go", donationInflows )
    res.render("donationInflow.ejs", {
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
    res.render("donationInflow.ejs", {
      donationInflows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

app.get("/donationInflows/inflowStats", async (req, res) => {
  try {
    console.log("yeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeessssssssssssssssss")
    const stats = await fetchDonationInflowsTotal();
    console.log(stats);
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
  const { recordName, donor, donorType, category, amount, donationDate } =
    req.body;
  const newDonor = {
    recordName: recordName,
    donor: req.body.donor,
    donorType: req.body.donorType,
    category: category,
    amount: amount,
    donationDate: donationDate,
  };
  
  try {
    await addDonationInflow(newDonor);
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
      res.render("donationInflow.ejs", { donationInflows });
    } else {
      res.render("donationInflow.ejs", { donationInflows: [] });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

app.post("/donationInflows/sortInflows", async (req, res) => {
  const sortBy = req.body.sortBy;
  console.log(sortBy);
  try {
    const donationInflows = await sortInflows(sortBy);
    console.log(donationInflows);
    res.render("donationInflow.ejs", {
      donationInflows,
    });
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
        const donor = finalResult.organizationname ? finalResult.organizationname : finalResult.firstname + " " + finalResult.lastname


        console.log("wwwwwwwwaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaiiiiiiiiiiiiiiiiiiiiiiii", finalResult);
        res.render("editInflow.ejs", { donation: finalResult, orgs: orgs, members: members, donor: donor}); // Pass only the first element
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
  console.log(inflowId);
  const { recordName, donor, donorType, category, amount, donationDate } =
    req.body;
  const updatedRecord = {
    recordName: recordName,
    donor: req.body.donor,
    donorType: req.body.donorType,
    category: category,
    amount: amount,
    donationDate: donationDate,
  };
  console.log("innnnnnnnnnnnnnnnnnnnnffffffffffffffffffffffllllllooooooowwwwwww")
  console.log(updatedRecord);
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
    console.log(donationOutflows);
    res.render("donationOutflow.ejs", { donationOutflows });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

app.post("/donationOutflows/newOutflows", async (req, res) => {
  const year = req.body.year;
  console.log(year);
  try {
    const donationOutflows = await fetchNewOutflows(year);
    res.render("donationOutflow.ejs", {
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

app.get("/donationOutflows/addDonationOutflow", async (req, res) => {
  const orgs = await fetchAllOrganizations();
  res.render("addOutflow.ejs", { orgs: orgs });
});

app.post("/donationOutflows/addOutflow", async (req, res) => {
  const { recordName, organization, category, amount, donationDate } =
    req.body;
  const newOrg = {
    recordName: recordName,
    organization: organization,
    category: category,
    amount: amount,
    donationDate: donationDate,
  };
  console.log(newOrg);
  try {
    await addDonationOutflow(newOrg);
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
      res.render("donationOutflow.ejs", { donationOutflows });
    } else {
      res.render("donationOutflow.ejs", { donationOutflows: [] });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

app.post("/donationOutflows/sortOutflows", async (req, res) => {
  const sortBy = req.body.sortBy;
  console.log(sortBy);
  try {
    const donationOutflows = await sortOutflows(sortBy);
    console.log(donationOutflows);
    res.render("donationOutflow.ejs", {
      donationOutflows,
    });
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
        const orgs = await fetchAllOrganizations();
        res.render("editOutflow.ejs", { donation: finalResult, orgs: orgs }); // Pass only the first element
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
  const { recordName, organization, category, amount, donationDate } =
    req.body;
  const updatedRecord = {
    recordName: recordName,
    organizationID: organization,
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
            return cb(err);
          } else {
            if (result) {
              return cb(null, {memberID: user.memberID});
            } else {
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
