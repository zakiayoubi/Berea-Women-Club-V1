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
  getMemberByName,
  getMemberDues,
  fetchNewMembers,
  fetchTotalMembers,
  fetchTotalMembersYear,
  addNewMember,
  addMembershipFee,
  updateMemberInformation,
  deleteMember,
  fetchMemberEvents,
  fetchEventMembers,
} from "./memberQueries.js";

import {
  fetchAllEvents,
  fetchEventById,
  sortEvents,
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
  if (req.isAuthenticated()) {
    res.render("index.ejs");
  } else {
    res.redirect("/login");
  }
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
  if (req.isAuthenticated()) {
    try {
      const result = await getMembers();
      res.render("member.ejs", {
        members: result,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.redirect("/login");
  }
});

// Route to handle POST request
app.post("/members/sort", async (req, res) => {
  if (req.isAuthenticated()) {
    const orderBy = req.body.sortby;
    console.log(orderBy);
    try {
      const result = await getMembers(orderBy);
      res.render("member.ejs", {
        members: result,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.redirect("/login");
  }
});

// Complete
app.post("/members/dues", async (req, res) => {
  if (req.isAuthenticated()) {
    const year = req.body.year;
    console.log(year);
    const status = req.body.status;
    console.log(status);
    try {
      const result = await getMemberDues(year, status);
      console.log(result);
      res.render("member.ejs", { members: result });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.redirect("/login");
  }
});

// Complete
app.post("/members/newMembers", async (req, res) => {
  if (req.isAuthenticated()) {
    const year = req.body.year;
    try {
      const members = await fetchNewMembers(year);
      console.log(members);
      // const totalMembers = await fetchTotalMembers();
      // console.log(totalMembers.count);
      // const totalMembersYear = await fetchTotalMembersYear(year);
      // console.log(totalMembersYear.count);
      res.render("member.ejs", {
        members,
        // totalMembers: totalMembers.count,
        // totalMembersYear: totalMembersYear.count
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.redirect("/login");
  }
});

app.get("/members/addMember", (req, res) => {
  if (req.isAuthenticated()) {
    try {
      res.render("addMember.ejs");
    } catch (error) {
      console.error(error);
      res.status(500);
    }
  } else {
    res.redirect("/login");
  }
});

app.post("/members/newMemberForm", async (req, res) => {
  if (req.isAuthenticated()) {
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

    const status = req.body.status;
    const paymentYear = req.body.paymentYear;
    let paymentDate = req.body.paymentDate ? status === "Paid" : null;
    paymentDate = !paymentDate ? null : paymentDate; // This sets paymentDate to null if it is either an empty string, undefined, or null

    console.log(paymentDate);
    try {
      // Step 1: Insert the new member and get back the auto-generated memberID
      const memberId = await addNewMember(newMember);
      console.log(memberId);

      // Step 2: Use the retrieved memberID to insert the membership fee
      await addMembershipFee(memberId, paymentYear, paymentDate, status);
      res.redirect(`/members/${memberId}`);
    } catch (error) {
      console.error("Error adding member and membership fee:", error);
      res.status(500).send("Error adding member and membership fee");
    }
  } else {
    res.redirect("/login");
  }
});

app.get("/members/searchMembers", async (req, res) => {
  if (req.isAuthenticated()) {
    const searchTerm = req.query.searchTerm.trim();
    try {
      const result = await getMemberByName(searchTerm);
      console.log(result);
      if (result.length > 0) {
        res.render("member.ejs", { members: result });
      } else {
        res.render("member.ejs", { members: [] });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.redirect("/login");
  }
});

// Complete
app.get("/members/:memberId", async (req, res) => {
  if (req.isAuthenticated()) {
    const memberId = req.params.memberId;
    if (/^\d+$/.test(memberId)) {
      const result = await getMemberById(memberId);
      if (result.length > 0) {
        console.log("**********************************************************")
        console.log("The result is", result)
        const finalResult = result[0];
        console.log(finalResult)  

        if (finalResult.dateofbirth) {
          const unformattedDateOfBirth = new Date(finalResult.dateofbirth);
          finalResult.dateofbirth = unformattedDateOfBirth
          .toISOString()
          .substring(0, 10);
        }

        if (finalResult.datejoined) {
          const unformattedDateJoined = new Date(finalResult.datejoined);
          finalResult.datejoined = unformattedDateJoined
          .toISOString()
          .substring(0, 10);
        }

        const memberDues = await getMemberDuesById(memberId);
        memberDues.forEach((due) => {
          if (due.paydate) {
            const newDate = new Date(due.paydate);
            due.paydate = newDate.toISOString().substring(0, 10);
          }
        });
        res.render("memberInfo.ejs", {
          member: finalResult,
          dues: memberDues,
        });
      } else {
        res.status(404).send("Invalid Member ID");
      }
    } else {
      res.status(404).send("Page Not Found");
    }
  } else {
    res.redirect("/login");
  }
});

app.post("/updatedMemberInfo/:memberId", async (req, res) => {
  if (req.isAuthenticated) {
    // Filter out empty dues before processing
    const filteredStatus = []
      .concat(req.body.status || [])
      .filter((s) => s !== "");
    const filteredPaymentYears = []
      .concat(req.body.paymentYear || [])
      .filter((y) => y !== "");
    const filteredPaymentDates = []
      .concat(req.body.paymentDate || [])
      .filter((d) => d !== "");
    console.log(filteredStatus);
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
      db.getDatabaseInstance().serialize(async () => {
        await updateMemberInformation(newMember);
        const deleteQuery = `
          DELETE FROM membershipFee
          WHERE memberId = ?
        `;
        await db.query(deleteQuery, [memberId]);
        for (let i = 0; i <= filteredPaymentYears.length - 1; i++) {
          await addMembershipFee(
            memberId,
            filteredPaymentYears[i],
            filteredPaymentDates[i],
            filteredStatus[i],
          );
        }
      });

      res.redirect(`/members/${memberId}`);
    } catch (error) {
      console.error("Error updating the member:", error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.redirect("/login");
  }
});

// Complete
app.post("/deleteMember/:memberId", async (req, res) => {
  if (req.isAuthenticated()) {
    const memberId = req.params.memberId;
    console.log(memberId);
    try {
      await deleteMember(memberId);
      res.redirect("/members");
    } catch (error) {
      console.error("Error deleting the member:", error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.redirect("/login");
  }
});

// -----------------------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------------
// organization route handlers

// Complete
app.get("/organizations", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const organizations = await fetchAllOrganizations();
      // const numOrganization = await fetchOrganizationCount();
      res.render("organization.ejs", { organizations });
    } catch (error) {
      console.error(error);
      res.status(500).send("Server error");
    }
  } else {
    res.redirect("/login");
  }
});

// Complete
app.get("/organizations/searchOrganization", async (req, res) => {
  if (req.isAuthenticated()) {
    const searchTerm = req.query.searchTerm.trim();
    try {
      const organizations = await fetchOrganizationByName(searchTerm);
      res.render("organization.ejs", { organizations });
    } catch (error) {
      console.error(error);
      res.status(500).send("Server error");
    }
  } else {
    res.redirect("/login");
  }
});

// Complete
app.get("/organizations/addOrganization", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      res.render("addOrganization.ejs");
    } catch (error) {
      console.error(error);
      res.status(500).send("Server error");
    }
  } else {
    res.redirect("/login");
  }
});

// sort org route
app.post("/organizations/sortOrg", async (req, res) => {
  if (req.isAuthenticated()) {
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
  } else {
    res.redirect("/login");
  }
});

app.post("/organizations/newOrgForm", async (req, res) => {
  if (req.isAuthenticated()) {
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
  } else {
    res.redirect("/login");
  }
});

// route to each organization
app.get("/organizations/:organizationId", async (req, res) => {
  if (req.isAuthenticated()) {
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
  } else {
    res.redirect("/login");
  }
});

// Complete
app.post("/updateOrganizationInfo/:organizationId", async (req, res) => {
  if (req.isAuthenticated()) {
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
  } else {
    res.redirect("/login");
  }
});

// Complete
app.post("/deleteOrganization/:organizationId", async (req, res) => {
  if (req.isAuthenticated()) {
    const orgId = req.params.organizationId;
    try {
      await deleteOrganization(orgId);
      res.redirect("/organizations");
    } catch (error) {
      console.error(error);
      res.status(500).send("Server error");
    }
  } else {
    res.redirect("/login");
  }
});

// --------------------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------------
// event handlers

app.get("/events", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const events = await fetchAllEvents();
      res.render("event.ejs", { events });
    } catch (error) {
      console.error(error);
      res.status(500).send("Server error");
    }
  } else {
    res.redirect("/login");
  }
});

app.get("/events/searchEvent", async (req, res) => {
  if (req.isAuthenticated()) {
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
  } else {
    res.redirect("/login");
  }
});

// Complete
app.get("/events/addEvent", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const members = await getMembers();
      res.render("addEvent.ejs", { members });
    } catch (error) {
      console.error(error);
      res.status(500).send("Server error");
    }
  } else {
    res.redirect("/login");
  }
});

// event stats route
app.get("/events/eventStats", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const stats = await fetchEventMoneyRaised();
      console.log(stats);
      res.render("eventStats.ejs", { stats });
    } catch (error) {
      console.error(error);
      res.status(500).send("Server error");
    }
  } else {
    res.redirect("/login");
  }
});

app.post("/events/newEventForm", async (req, res) => {
  if (req.isAuthenticated()) {
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

      const events = await fetchAllEvents();
      res.render("event.ejs", {
        events: events,
      });
    } catch (error) {
      console.error("Error adding event", error);
      res.status(500).send("Error adding event");
    }
  } else {
    res.redirect("/login");
  }
});

// sort events route
app.post("/events/sortEvent", async (req, res) => {
  if (req.isAuthenticated()) {
    const sortBy = req.body.sortBy;
    try {
      const result = await sortEvents(sortBy);
      res.render("event.ejs", {
        events: result,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Server error");
    }
  } else {
    res.redirect("/login");
  }
});

// new events route
app.post("/events/newEvents", async (req, res) => {
  if (req.isAuthenticated()) {
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
  } else {
    res.redirect("/login");
  }
});

// route to each event
app.get("/events/:eventId", async (req, res) => {
  if (req.isAuthenticated()) {
    const eventId = req.params.eventId;
    if (/^\d+$/.test(eventId)) {
      const result = await fetchEventById(eventId);
      if (result.length > 0) {
        const finalResult = result[0];
        const newDate = new Date(finalResult.eventdate);
        finalResult.eventdate = newDate.toISOString().substring(0, 10);

        const allMembers = await getMembers();
        const attendees = await fetchEventAttendees(eventId);

        res.render("eventInfo.ejs", {
          event: finalResult,
          members: allMembers,
          attendeesList: attendees,
        });
      } else {
        res.status(404).send("Invalid Event ID");
      }
    } else {
      res.status(404).send("Page Not Found");
    }
  } else {
    res.redirect("/login");
  }
});

app.post("/updateEventInfo/:eventId", async (req, res) => {
  if (req.isAuthenticated()) {
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
  } else {
    res.redirect("/login");
  }
});

app.post("/deleteEvent/:eventId", async (req, res) => {
  if (req.isAuthenticated()) {
    const eventId = req.params.eventId;
    console.log(eventId);
    try {
      await deleteEvent(eventId);
      res.redirect("/events");
    } catch (error) {
      console.error("Error deleting the event:", error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.redirect("/login");
  }
});

// ---------------------------------------------------------------------------------

app.get("/donationInflows", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const donationInflows = await fetchDonationInflows();
      res.render("donationInflow.ejs", {
        donationInflows,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Server error");
    }
  } else {
    res.redirect("/login");
  }
});

app.post("/donationInflows/newInflows", async (req, res) => {
  if (req.isAuthenticated()) {
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
  } else {
    res.redirect("/login");
  }
});

app.get("/donationInflows/inflowStats", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const stats = await fetchDonationInflowsTotal();
      console.log(stats);
      res.render("donationInflowStats.ejs", { stats });
    } catch (error) {
      console.error(error);
      res.status(500).send("Server error");
    }
  } else {
    res.redirect("/login");
  }
});

app.get("/donationInflows/addDonationInflow", async (req, res) => {
  if (req.isAuthenticated()) {
    const orgs = await fetchAllOrganizations();
    res.render("addInflow.ejs", { orgs: orgs });
  } else {
    res.redirect("/login");
  }
});

app.post("/donationInflows/create", async (req, res) => {
  if (req.isAuthenticated()) {
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
      await addDonationInflow(newOrg);
      res.redirect("/donationInflows");
    } catch (err) {
      console.log("failure");
    }
  } else {
    res.redirect("/login");
  }
});

app.get("/donationInflows/searchInflow", async (req, res) => {
  if (req.isAuthenticated()) {
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
  } else {
    res.redirect("/login");
  }
});

app.post("/donationInflows/sortInflows", async (req, res) => {
  if (req.isAuthenticated()) {
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
  } else {
    res.redirect("/login");
  }
});

app.get("/donationInflows/:donationInflowId", async (req, res) => {
  if (req.isAuthenticated()) {
    const inflowId = req.params.donationInflowId; // Retrieve the ID from the query parameters
    if (/^\d+$/.test(inflowId)) {
      try {
        const result = await fetchDonationInflowById(inflowId);
        if (result.length > 0) {
          const finalResult = result[0];
          const newDate = new Date(finalResult.donationdate);
          finalResult.donationdate = newDate.toISOString().substring(0, 10);
          const orgs = await fetchAllOrganizations();
          res.render("editInflow.ejs", { donation: finalResult, orgs: orgs }); // Pass only the first element
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
  } else {
    res.redirect("/login");
  }
});

app.post("/updateDonationInflow/:donationInflowId", async (req, res) => {
  if (req.isAuthenticated()) {
    const inflowId = req.params.donationInflowId;
    console.log(inflowId);
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
      await updateDonationInflow(inflowId, updatedRecord);
      res.redirect("/donationInflows");
    } catch (error) {
      console.error("Error executing update query", error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.redirect("/login");
  }
});

app.post("/deleteInflow/:donationInflowId", async (req, res) => {
  if (req.isAuthenticated()) {
    const inflowId = req.params.donationInflowId;
    console.log(inflowId);

    try {
      await deleteDonationInflow(inflowId);
      res.redirect("/donationInflows");
    } catch (error) {
      console.error("Error executing delete query", error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.redirect("/login");
  }
});

// ----------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------

app.get("/donationOutflows", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const donationOutflows = await fetchDonationOutflows();
      console.log(donationOutflows);
      res.render("donationOutflow.ejs", { donationOutflows });
    } catch (error) {
      console.error(error);
      res.status(500).send("Server error");
    }
  } else {
    res.redirect("/login");
  }
});

app.post("/donationOutflows/newOutflows", async (req, res) => {
  if (req.isAuthenticated()) {
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
  } else {
    res.redirect("/login");
  }
});

app.get("/donationOutflows/outflowStats", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const stats = await fetchDonationOutflowsTotal();
      console.log(stats);
      res.render("donationOutflowStats.ejs", { stats });
    } catch (error) {
      console.error(error);
      res.status(500).send("Server error");
    }
  } else {
    res.redirect("/login");
  }
});

app.get("/donationOutflows/addDonationOutflow", async (req, res) => {
  if (req.isAuthenticated()) {
    const orgs = await fetchAllOrganizations();
    res.render("addOutflow.ejs", { orgs: orgs });
  } else {
    res.redirect("/login");
  }
});

app.post("/donationOutflows/addOutflow", async (req, res) => {
  if (req.isAuthenticated()) {
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
  } else {
    res.redirect("/login");
  }
});

app.get("/donationOutflows/searchOutflow", async (req, res) => {
  if (req.isAuthenticated()) {
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
  } else {
    res.redirect("/login");
  }
});

app.post("/donationOutflows/sortOutflows", async (req, res) => {
  if (req.isAuthenticated()) {
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
  } else {
    res.redirect("/login");
  }
});

app.get("/donationOutflows/:donationOutflowId", async (req, res) => {
  if (req.isAuthenticated()) {
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
  } else {
    res.redirect("/login");
  }
});

app.post("/updateDonationOutflow/:donationOutflowId", async (req, res) => {
  if (req.isAuthenticated()) {
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
  } else {
    res.redirect("/login");
  }
});

app.post("/deleteOutflow/:donationOutflowId", async (req, res) => {
  if (req.isAuthenticated()) {
    const OutflowId = req.params.donationOutflowId;
    console.log(OutflowId);

    try {
      await deleteDonationOutflow(OutflowId);
      res.redirect("/donationOutflows");
    } catch (error) {
      console.error("Error executing delete query", error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.redirect("/login");
  }
});

passport.serializeUser((user, cb) => {
  cb(null, {id: user.id});
});

passport.deserializeUser(async (user, cb) => {
  cb(null, await db.get("SELECT id,email FROM users WHERE id=?",user.id));
});

passport.use(
  new Strategy(async function verify(username, password, cb) {
    // username and password are auto grabbed from our frontend.

    try {
      const user = await db.get("SELECT * FROM users WHERE email = ?", [ username ]);
      if (user) {
        const storedHashedPassword = user.password;
        bcrypt.compare(password, storedHashedPassword, (err, result) => {
          if (err) {
            return cb(err);
          } else {
            if (result) {
              return cb(null, {id: user.id, email: user.email});
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
