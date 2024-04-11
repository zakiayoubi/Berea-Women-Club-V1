import express from "express";
import {
    getMembers,
    getMemberByID,
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
  insertEvent,
  updateEvent,
  deleteEvent,
} from "./eventQueries.js";

const app = express();
const port = 3000;


app.use(express.json());
app.use(express.static("public"));
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

// Complete
app.get('/members/dues', async (req, res) => {
  const year = req.query.year || 2024;
  const status = req.query.status || "paid";
  try {
    const result = await getMemberDues(year, status);
    console.log(result);
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

// app.get('/events/amount-raised/yearly', async (req, res) => {
//   try {
//     const rows = await fetchAmountRaisedYearly();
//     res.json(rows);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Server error');
//   }
// });

// app.get('/events/amount-raised/monthly/:year', async (req, res) => {
//   try {
//     const year = parseInt(req.params.year);
//     const rows = await fetchAmountRaisedMonthly(year);
//     res.json(rows);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Server error');
//   }
// });

// app.post('/events', async (req, res) => {
//   try {
//     const eventData = req.body;
//     const event = await insertEvent(eventData);
//     res.status(201).json(event);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Server error');
//   }
// });
// app.put('/events/:id', async (req, res) => {
//   try {
//     const eventID = req.params.id;
//     const eventData = req.body;
//     const updatedEvent = await updateEvent(eventID, eventData);
//     if (updatedEvent.length > 0) {
//       res.json(updatedEvent[0]);
//     } else {
//       res.status(404).send('Event not found');
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Server error');
//   }
// });
// app.delete('/events/:id', async (req, res) => {
//   try {
//     const eventID = req.params.id;
//     const rowCount = await deleteEvent(eventID);
//     if (rowCount > 0) {
//       res.status(204).send();
//     } else {
//       res.status(404).send('Event not found');
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Server error');
//   }
// });

// app.get('/member-events/:firstname', async (req, res) => {
//   const firstname = req.params.firstname;
//   try {
//     const events = await fetchMemberEvents(firstname);
//     res.render('member-events', { events, member: firstname });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Server error');
//   }
// });

// // Route: All Members Attended an Event
// app.get('/event-members/:eventname', async (req, res) => {
//   const eventname = req.params.eventname;
//   try {
//     const members = await fetchEventMembers(eventname);
//     res.render('event-members', { members, event: eventname });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Server error');
//   }
// });

// // -------------------------------------------------------------
// app.get('/donation-inflows', async (req, res) => {
//   try {
//     const inflows = await fetchDonationInflows();
//     res.render('donation-inflows', { inflows });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Server error');
//   }
// });

// // Donation Inflow by Specific ID
// app.get('/donation-inflows/:id', async (req, res) => {
//   const specificId = req.params.id;
//   try {
//     const inflows = await fetchDonationInflowById(specificId);
//     res.render('donation-inflow-detail', { inflow: inflows[0] });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Server error');
//   }
// });

// // Amount Raised Per Year
// app.get('/donation-inflows/amount-raised/yearly', async (req, res) => {
//   try {
//     const yearlyTotals = await fetchAmountRaisedYearly();
//     res.render('amount-raised-yearly', { yearlyTotals });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Server error');
//   }
// });
// app.post('/donation-inflows', async (req, res) => {
//   try {
//     const newInflow = await insertDonationInflow(req.body);
//     res.status(201).json(newInflow);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Server error');
//   }
// });
// app.put('/donation-inflows/:id', async (req, res) => {
//   const donationInflowId = req.params.id;
//   try {
//     const updatedInflow = await updateDonationInflow(donationInflowId, req.body);
//     if (updatedInflow) {
//       res.json(updatedInflow);
//     } else {
//       res.status(404).send('Donation Inflow not found');
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Server error');
//   }
// });
// app.delete('/donation-inflows/:id', async (req, res) => {
//   const donationInflowId = req.params.id;
//   try {
//     const deletedInflow = await deleteDonationInflow(donationInflowId);
//     if (deletedInflow) {
//       res.json({ message: 'Donation Inflow deleted successfully', deletedInflow });
//     } else {
//       res.status(404).send('Donation Inflow not found');
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Server error');
//   }
// });

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
