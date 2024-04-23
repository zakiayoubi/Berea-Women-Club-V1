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

const app = express();
const router = express.Router();

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




// Route to handle POST request
app.post('/members/sort', async(req, res) => {
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
app.post('/members/dues', async (req, res) => {
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
app.post('/members/newMembers', async (req, res) => {
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
  } catch (error) {
    console.error('Error adding member and membership fee:', error);
    res.status(500).send('Error adding member and membership fee');
  }
});

app.get('/members/search', async (req, res) => {
  console.log('Received request:', req.query);
  const searchTerm = req.query.searchTerm;
  console.log('Search term:', searchTerm);
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
      await updateOrInsertMembershipFee(db, memberId, filteredPaymentYears[i], filteredStatus[i], filteredPaymentDates[i]);
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

// -----------------------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------------
// organization route handlers

// Complete
app.get('/organizations', async (req, res) => {
  try {
    const organizations = await fetchAllOrganizations();
    // const numOrganization = await fetchOrganizationCount();
    res.render("organization.ejs", { organizations});
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Complete
app.get('/organizations/searchOrganization', async (req, res) => {
  const searchTerm = req.query.searchTerm;
  try {
    const organizations = await fetchOrganizationByName(searchTerm);
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
app.get('/organizations/addOrganization', async (req, res) => {
  try {
    res.render('addOrganization.ejs');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// sort org route
app.post('/organizations/sortOrg', async (req, res) => {
  const sortBy = req.body.sortBy;
  try {
    const result = await sortOrganizations(sortBy);
    res.render("organization.ejs", {
      organizations: result
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
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
  
  const newOrg = {"organizationName": organizationName, "organizationType": organizationType,
                   "streetName": street, "city": city, "usState": state, "zipCode": zip, 
                   "email": email, "phoneNumber": phoneNumber};

  try {
    // Step 1: Insert the new event
    await addOrganization(newOrg);

    const result = await fetchAllOrganizations();
    res.render("organization.ejs", {
      organizations: result
    });
  } catch (error) {
    console.error('Error adding organization', error);
    res.status(500).send('Error adding organization');
  }
});

// route to each organization
app.get("/organizations/:organizationId", async (req, res) => {
  const organizationId = req.params.organizationId;
  console.log(organizationId);
  const result = await fetchSpecificOrganization(organizationId);
  console.log(result[0]);
  res.render("organizationInfo.ejs", {
    organization: result[0],
  });
});

// Complete
app.post('/updateOrganizationInfo/:organizationId', async (req, res) => {
  const orgId = req.params.organizationId;

  const { organizationName, organizationType, email, phoneNumber, street, city, state, zip} = req.body;


  const orgData = {"organizationName": organizationName, "organizationType": organizationType, "email": email, "phoneNumber": phoneNumber,
                "streetName": street, "city": city, "usState": state, "zipCode": zip};

  console.log(orgData);
  
  try {
    await updateOrganization(orgId, orgData);
    res.redirect(`/organizations/${orgId}`);
    
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Complete
app.post('/deleteOrganization/:organizationId', async (req, res) => {
  const orgId = req.params.organizationId;
  console.log(orgId);
  try {
    await deleteOrganization(orgId);
    res.redirect("/organizations")
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// --------------------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------------
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

// Complete
app.get('/events/addEvent', async (req, res) => {
  try {
    res.render("addEvent.ejs")
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
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
  
  const newEvent = {"eventName": eventName, "eventLocation": location,
                   "streetName": street, "city": city, "usState": state, "zipCode": zip, 
                   "eventDate": eventDate, "eventType": eventType, "eventCost": cost, "amountRaised": amountRaised};
  console.log(newEvent);

  try {
    // Step 1: Insert the new event
    await insertEvent(newEvent);

    const result = await fetchAllEvents();
    res.render("event.ejs", {
      events: result
    });
  } catch (error) {
    console.error('Error adding event', error);
    res.status(500).send('Error adding event');
  }
});

// sort events route
app.post('/events/sortEvent', async (req, res) => {
  const sortBy = req.body.sortBy;
  try {
    const result = await sortEvents(sortBy);
    res.render("event.ejs", {
      events: result
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// new events route
app.post('/events/newEvents', async (req, res) => {
  const year = req.body.year;
  console.log(year);

  try {
    const events = await fetchNewEvents(year);
    res.render("event.ejs", {
      events
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// route to each event
app.get("/events/:eventId", async (req, res) => {
  const eventId = req.params.eventId;

  const result = await fetchEventById(eventId);
  const finalResult = result[0];
  const newDate = new Date(finalResult.eventdate);
  finalResult.eventdate = newDate.toISOString().substring(0, 10);

  res.render("eventInfo.ejs", {
    event: finalResult,
  });
});

app.post("/updateEventInfo/:eventId", async(req, res) => {

const eventId = req.params.eventId;
console.log(eventId);
const { eventName, location, street, city, state, zip, eventDate, eventCost, amountRaised, eventType} = req.body;


const newEvent = {"eventName": eventName, "eventLocation": location,
                "streetName": street, "city": city, "usState": state, "zipCode": zip, 
                "eventDate": eventDate, "eventType": eventType, "eventCost": Number(eventCost), "amountRaised": Number(amountRaised)};

console.log(newEvent);
try {
  await updateEvent(eventId, newEvent);
  res.redirect(`/events/${eventId}`)
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
    res.redirect("/events")
  } catch (error) {
    console.error("Error deleting the event:", error);
    res.status(500).send("Internal Server Error");
  }
});





// // Complete
// app.get('/events/amount-raised-yearly', async (req, res) => {
//   const year = req.body.year || 2024;  
//   try {
//     const result = await fetchEventMoneyRaised(year);
//     console.log(result);
//     const moneyRaised = await fetchYearlyMoneyRaised(year);
//     console.log(moneyRaised)
//     res.render("event.ejs", {
//       events: result,
//       eventIncome: moneyRaised,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Server error');
//   }
// });

// // Complete
// app.get('/events/cost-yearly', async (req, res) => {
//   const year = req.body.year || 2024;  
//   try {
//     const result = await fetchEventMonthlyCosts(year);
//     console.log(result);
//     const moneyRaised = await fetchYearlyEventCosts(year);
//     console.log(moneyRaised)
//     res.render("event.ejs", {
//       events: result,
//       eventIncome: moneyRaised,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Server error');
//   }
// });


// // Complete
// app.get('/member-events/:id', async (req, res) => {
//   const memberId = req.params.id;
//   try {
//     const events = await fetchMemberEvents(memberId);
//     console.log(events);
//     res.status(204).send();
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Server error');
//   }
// });

// // Complete
// app.get('/event-members/:id', async (req, res) => {
//   const eventId = req.params.id;
//   try {
//     const members = await fetchEventMembers(eventId);
//     console.log(members);
//     res.json("Success");
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
