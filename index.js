import express from "express";
import db from "./db.js";
import bodyParser from "body-parser";
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
    updateOrInsertMembershipFee,
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
  try {
    const result = await getMembers();
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
    console.log(result);
    res.render("member.ejs", { members: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// // Complete
// app.get("/members/:memberId", async (req, res) => {
//   const memberId = req.params.memberId; // Extract the memberID from the URL parameters
//   try {
//     const member = await getMemberByName(memberId);
//     if (member) {
//       res.render("member.ejs", {
//         members: member
//       });
//     } else {
//       res.status(404).send("Member not found");
//     }
//   } catch (error) {
//     console.error("Error fetching the member:", error);
//     res.status(500).send("Internal Server Error");
//   }
// });


// Complete
app.post('/newMembers', async (req, res) => {
  const year = req.body.year;
  console.log(year);
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
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/addMember", (req, res) => {
  try {
    res.render("addMember.ejs");
  } catch (error) {
    console.error(error);
    res.status(500);
  }
});

app.post("/newMemberForm", async (req, res) => {
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
  
  const newMember = {"firstName": firstName, "lastName": lastName, "email": email,
                   "phone": phone, "street": street, "city": city, "state": state, "zip": zip, 
                   "dateOfBirth": dateOfBirth, "dateJoined": dateJoined, "membershipType": membershipType};
  console.log(newMember);

  const status = req.body.status;
  const paymentYear = req.body.paymentYear;
  let paymentDate = req.body.paymentDate;
  paymentDate = paymentDate === '' ? null : paymentDate;

  const dues = {"status": status, "paymentYear": paymentYear, "paymentDate": paymentDate};
  console.log(dues)

  try {
    // Step 1: Insert the new member and get back the auto-generated memberID
    const memberId = await addNewMember(newMember);
    console.log(memberId);

    // Step 2: Use the retrieved memberID to insert the membership fee
    await addMembershipFee(memberId, dues);

    const result = await getMembers();
    res.render("member.ejs", {
      members: result
    });
    console.log('Member and membership fee added successfully');
    res.render("member.ejs");
  } catch (error) {
    console.error('Error adding member and membership fee:', error);
    res.status(500).send('Error adding member and membership fee');
  }
});


// Complete
app.get("/members/:memberId", async (req, res) => {
  const memberId = req.params.memberId;
  const result = await getMemberById(memberId);
  const finalResult = result[0];

  const memberDues = await getMemberDuesById(memberId);
  memberDues.forEach(due => {
    const newDate = new Date(due.paydate);
    due.paydate = newDate.toISOString().substring(0, 10);
  });

  const unformattedDateOfBirth = new Date(finalResult.dateofbirth);
  finalResult.dateofbirth = unformattedDateOfBirth.toISOString().substring(0, 10);

  const unformattedDateJoined = new Date(finalResult.datejoined);
  finalResult.datejoined = unformattedDateJoined.toISOString().substring(0, 10);
  res.render("memberInfo.ejs", {
    member: finalResult,
    dues: memberDues,
  });
});

app.post("/updatedMemberInfo/:memberId", async(req, res) => {
    // Filter out empty dues before processing
  const filteredStatus = [].concat(req.body.status || []).filter(s => s !== '');
  const filteredPaymentYears = [].concat(req.body.paymentYear || []).filter(y => y !== '');
  const filteredPaymentDates = [].concat(req.body.paymentDate || []).filter(d => d !== '');
    
  const memberId = req.params.memberId;
  const { firstName, lastName, email, phone, street, city, state, zip, dateOfBirth, dateJoined, membershipType} = req.body;

  
  const newMember = {"memberId": memberId, "firstName": firstName, "lastName": lastName, "email": email,
                   "phoneNumber": phone, "streetName": street, "city": city, "usState": state, "zipCode": zip, 
                   "dateOfBirth": dateOfBirth, "dateJoined": dateJoined, "memberType": membershipType};

  try {
    await updateMemberInformation(newMember);
    for (let i=0; i<=(filteredPaymentYears.length - 1); i++) {
      await updateOrInsertMembershipFee(db, memberId, filteredPaymentYears[i], filteredStatus[i], filteredPaymentDates[i], );
    }
    res.redirect(`/members/${memberId}`)
  } catch (error) {
    console.error("Error updating the member:", error);
    res.status(500).send("Internal Server Error");
  }
  
});


// Complete
app.post("/deleteMember/:memberId", async (req, res) => {
  const memberId = req.params.memberId;
  console.log(memberId);
  try {
    await deleteMember(memberId);
    res.redirect("/members")
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
