import express from "express";
import bodyParser from "body-parser";
import {
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
    fetchAllOrganizations,
    fetchOrganizationCount,
    fetchSpecificOrganization,
    addOrganization,
    updateOrganization,
    deleteOrganization,
} from "./organizationQueries.js";

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
} from "./eventQueries.js";


import { fetchDonationInflows,
  fetchDonationInflowById,
  fetchDonationInflowRaisedYearly,
  insertDonationInflow,
  updateDonationInflow,
  deleteDonationInflow,} from "./donationInflowQueries.js"
  
const app = express();

const port = 3000;


app.use(express.json());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs'); // Set the view engine to EJS




// Complete
app.get("/", (req, res) => {
  res.render("index.ejs", );
});



// Complete
app.get('/members', async (req, res) => {
  const orderBy = req.query.orderBy || 'memberID'; // You can pass 'firstName', 'lastName', or 'dateJoined' as query parameters
  try {
    const result = await getMembers(orderBy);
    console.log(result);
    res.render("member.ejs", {
      members: result
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/search', async (req, res) => {
  const searchTerm = req.query.searchTerm;
  console.log(searchTerm);
  try {
    const result = await getMemberByName(searchTerm);
    console.log(result);
    res.render("member.ejs", {
      members: result
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Route to handle POST request
app.post('/sort', async(req, res) => {
  const orderBy = req.body.sortby;
  console.log(orderBy);
  try {
    const result = await getMembers(orderBy);
    res.render("member.ejs", {
      members: result
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete
app.post('/dues', async (req, res) => {
  const year = req.body.year;
  console.log(year);
  const status = req.body.status;
  console.log(status);
  try {
    const result = await getMemberDues(year, status);
    res.render("member.ejs", { members: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Complete
app.get("/members/:memberId", async (req, res) => {
  const memberId = req.params.memberId; // Extract the memberID from the URL parameters
  try {
    const member = await getMemberByID(memberId);
    if (member) {
      res.render("member.ejs", {
        members: member
      });
    } else {
      res.status(404).send("Member not found");
    }
  } catch (error) {
    console.error("Error fetching the member:", error);
    res.status(500).send("Internal Server Error");
  }
});


// Complete
app.get('/new-members', async (req, res) => {
  const year = req.query.year || '2024'; // Default to 2024
  try {
    const members = await fetchNewMembers(year);
    console.log(members);
    const totalMembers = await fetchTotalMembers();
    console.log(totalMembers.count);
    const totalMembersYear = await fetchTotalMembersYear(year);
    console.log(totalMembersYear.count);

    res.render("member.ejs", {
      members,
      totalMembers: totalMembers.count,
      totalMembersYear: totalMembersYear.count
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete
app.post("/addMember", async (req, res) => {
  const newMember = req.body;
  try {
    // Step 1: Insert the new member and get back the auto-generated memberID
    const memberId = await addNewMember(newMember);
    console.log(memberId);

    // Step 2: Use the retrieved memberID to insert the membership fee
    await addMembershipFee(memberId, newMember.payDate, newMember.status);

    console.log('Member and membership fee added successfully');
    res.status(200).send('Member and membership fee added successfully');
  } catch (error) {
    console.error('Error adding member and membership fee:', error);
    res.status(500).send('Error adding member and membership fee');
  }
});


// Complete
app.put("/updateMember", async (req, res) => {
  try {
    await updateMemberInformation(req.body);
    res.json({ message: "Member and membership information updated successfully" });
  } catch (error) {
    console.error("Failed to update member and membership information:", error);
    res.status(500).send("Internal Server Error");
  }
});


// Complete
app.delete("/deleteMember", async (req, res) => {
  const memberId = req.body.memberId;

  try {
    await deleteMember(memberId);
    res.json({ message: "Member deleted successfully" });
  } catch (error) {
    console.error("Error deleting the member:", error);
    res.status(500).send("Internal Server Error");
  }
});

// -------------------------------------------------------------------
// organization route handlers

// Complete
app.get('/organizations', async (req, res) => {
  try {
    const organizations = await fetchAllOrganizations();
    console.log(organizations);
    const numOrganization = await fetchOrganizationCount();
    res.render("organization.ejs", { organizations, numOrganization });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Complete
app.get('/organizations/:id', async (req, res) => {
  try {
    const organizations = await fetchSpecificOrganization(req.params.id);
    if (organizations.length > 0) {
      res.render("organization.ejs", { organizations });
    } else {
      res.status(404).send('Organization not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Complete
app.post('/addOrganization', async (req, res) => {
  try {
    await addOrganization(req.body);
    res.status(201).send('You successfully added an organization');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Complete
app.put('/updateOrganization', async (req, res) => {
  try {
    const result = await updateOrganization(req.query.id, req.body);
    if (result.length > 0) {
      res.json(result[0]);
    } else {
      res.status(404).send('Organization not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Complete
app.delete('/deleteOrganization/:id', async (req, res) => {
  try {
    await deleteOrganization(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// -----------------------------------------------------------
// event handlers


// Complete
app.get('/events', async (req, res) => {
  try {
    const events = await fetchAllEvents();
    res.render("event.ejs", {
      events
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Complete
app.get('/events/amount-raised-yearly', async (req, res) => {
  const year = req.body.year || 2024;  
  try {
    const result = await fetchEventMoneyRaised(year);
    console.log(result);
    const moneyRaised = await fetchYearlyMoneyRaised(year);
    console.log(moneyRaised)
    res.render("event.ejs", {
      events: result,
      eventIncome: moneyRaised,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Complete
app.get('/events/cost-yearly', async (req, res) => {
  const year = req.body.year || 2024;  
  try {
    const result = await fetchEventMonthlyCosts(year);
    console.log(result);
    const moneyRaised = await fetchYearlyEventCosts(year);
    console.log(moneyRaised)
    res.render("event.ejs", {
      events: result,
      eventIncome: moneyRaised,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Complete
app.get('/events/:id', async (req, res) => {
  try {
    const events = await fetchEventById(req.params.id);
    res.render("event.ejs", {
      events
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});


// Complete
app.get('/events', async (req, res) => {
  try {
    const events = await sortEvents(req.query.sortBy);
    res.render("event.ejs", {
      events
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});


// Complete
app.post('/addEvent', async (req, res) => {
  try {
    const eventData = req.body;
    const event = await insertEvent(eventData);
    console.log(event);
    res.status(201).json(event);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Complete
app.put('/updateEvent/:id', async (req, res) => {
  try {
    const eventID = req.params.id;
    const eventData = req.body;
    const updatedEvent = await updateEvent(eventID, eventData);
    console.log(updateEvent);
    if (updatedEvent.length > 0) {
      res.json(updatedEvent[0]);
    } else {
      res.status(404).send('Event not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Complete
app.delete('/deleteEvent/:id', async (req, res) => {
  try {
    const eventID = req.params.id;
    const rowCount = await deleteEvent(eventID);
    console.log(rowCount);
    if (rowCount > 0) {
      res.status(204).send();
    } else {
      res.status(404).send('Event not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Complete
app.get('/member-events/:id', async (req, res) => {
  const memberId = req.params.id;
  try {
    const events = await fetchMemberEvents(memberId);
    console.log(events);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Complete
app.get('/event-members/:id', async (req, res) => {
  const eventId = req.params.id;
  try {
    const members = await fetchEventMembers(eventId);
    console.log(members);
    res.json("Success");
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// -------------------------------------------------------------
// Donation Inflows!!!!
function isValidDonationInflowId(id) {
  console.log(id);
  return Number.isInteger(id) && id > 0;
}


app.get('/donationInflows', async (req, res) => {
    try {
      const inflows = await fetchDonationInflows(); // Assuming fetchDonationInflows is a function to retrieve inflows
      res.render('donationInflow.ejs', { inflows });
      console.log(inflows);
  } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
  }
});

app.post('/delete', async (req, res) => {
  let donationInflowId = req.body.deleteId;
  
  // Parse the delete ID to an integer
  donationInflowId = parseInt(donationInflowId);
console.log( donationInflowId);
console.log(typeof donationInflowId);
console.log(typeof donationInflowId);
console.log(typeof donationInflowId);
  try {
      if (isNaN(donationInflowId) || donationInflowId <= 0) {
          return res.status(400).json({ message: 'Invalid Donation Inflow ID' });
      }

      // Proceed with the delete operation
      const deletedInflow = await deleteDonationInflow(donationInflowId);
      if (deletedInflow) {
          res.json({ message: 'Donation Inflow deleted successfully', deletedInflow });
      } else {
          res.status(404).json({ message: 'Donation Inflow not found' });
      }
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
  }
});






// // Fetch all donation outflows
// app.get('/donation-outflows', async (req, res) => {
//   try {
//     const outflows = await fetchDonationOutflows();
//     res.render('donation-outflows', { outflows });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Server error');
//   }
// });

// // Fetch a specific donation outflow by ID
// app.get('/donation-outflows/:id', async (req, res) => {
//   try {
//     const outflow = await fetchDonationOutflowById(req.params.id);
//     res.render('donation-outflow-detail', { outflow: outflow[0] });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Server error');
//   }
// });

// // Fetch donation outflows ordered by criteria
// ['amount', 'category', 'date'].forEach(criteria => {
//   app.get(`/donation-outflows/${criteria}`, async (req, res) => {
//     try {
//       const outflows = await fetchDonationOutflowsOrderedBy(criteria);
//       res.render(`donation-outflows-${criteria}`, { outflows });
//     } catch (error) {
//       console.error(error);
//       res.status(500).send('Server error');
//     }
//   });
// });

// // Fetch amount donated yearly
// app.get('/donation-outflows/yearly', async (req, res) => {
//   try {
//     const yearlyTotals = await fetchAmountDonatedYearly();
//     res.render('donation-outflows-yearly', { yearlyTotals });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Server error');
//   }
// });
// app.post('/donation-outflows', async (req, res) => {
//   try {
//     const newOutflow = await insertDonationOutflow(req.body);
//     res.status(201).json(newOutflow);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Server error');
//   }
// });
// app.put('/donation-outflows/:id', async (req, res) => {
//   const donationOutflowId = req.params.id;
//   try {
//     const updatedOutflow = await updateDonationOutflow(donationOutflowId, req.body);
//     if (updatedOutflow) {
//       res.json(updatedOutflow);
//     } else {
//       res.status(404).send('Donation Outflow not found');
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Server error');
//   }
// });
// app.delete('/donation-outflows/:id', async (req, res) => {
//   const donationOutflowId = req.params.id;
//   try {
//     const deletedOutflow = await deleteDonationOutflow(donationOutflowId);
//     if (deletedOutflow) {
//       res.json({ message: 'Donation Outflow deleted successfully', deletedOutflow });
//     } else {
//       res.status(404).send('Donation Outflow not found');
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Server error');
//   }
// });


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
