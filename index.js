import express from "express";
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
  addDonationInflow,
  updateDonationInflow,
  deleteDonationInflow,
  getDonationInflowByName,
  fetchSortedDonationInflows,
} from "./donationInflowQueries.js"


import {
  fetchDonationOutflows,
  fetchDonationOutflowById,
  updateDonationOutflow,
  deleteDonationOutflow,
  addDonationOutflow,
  getDonationOutflowByName,
  fetchSortedDonationOutflows,
} from "./donationOutflowQueries.js"
  
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
  const memberId = req.params.memberId;
  const { firstName, lastName, email, phone, street, city, state, zip, dateOfBirth, dateJoined, membershipType, status} = req.body;
  
  const newMember = {"memberId": memberId, "firstName": firstName, "lastName": lastName, "email": email,
                   "phoneNumber": phone, "streetName": street, "city": city, "usState": state, "zipCode": zip, 
                   "dateOfBirth": dateOfBirth, "dateJoined": dateJoined, "memberType": membershipType};
  console.log(newMember);
  try {
    await updateMemberInformation(newMember);
    res.json({ message: "Member updated successfully" });
  } catch (error) {
    console.error("Error updating the member:", error);
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


app.get('/donationInflows', async (req, res) => {
    try {
      const donationInflow = await fetchDonationInflows(); // Assuming fetchDonationInflows is a function to retrieve inflows

      res.render('donationInflow.ejs', { donationInflow });
 
  } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
  }
});

// Import your database model (assuming it's named DonationInflow)


app.get('/donationInflows/edit', async (req, res) => {
  try {
    const inflowId = req.query.id; // Retrieve the ID from the query parameters
    console.log(req.body);

    // Proceed with fetching the entity information based on the received ID
 
    const inflow = await fetchDonationInflowById(inflowId);
    console.log(inflow);

    if (inflow.length > 0) {
    res.render('edit.ejs', { donationInflow: inflow[0] }); // Pass only the first element
} else {
    res.status(404).send('Donation inflow not found');
}

    // Render the template with the fetched entity information
  } catch (error) {
    console.error('Error fetching donation inflow:', error);
    res.render('error', { message: 'An error occurred' });
  }
});


app.post('/donationInflows/update', async (req, res) => {
  const { id, category, amount, donationDate,recordName } = req.body;

  if (!id) {
      return res.status(400).send('Error: ID is missing');
  }

  try {
    const updatedRecord = await updateDonationInflow(id, { category, amount, donationDate,recordName });

    if (!updatedRecord) {
      return res.status(404).send('No record found with the given ID.');
    }

    // Send the updated record back to the client
    res.redirect('/donationInflows')
  } catch (error) {
    console.error('Error executing update query', error);
    res.status(500).send('Internal Server Error');
  }
});
app.get('/error', (req, res) => {
  res.status(500).send('Sorry, something went wrong.');
});



app.post('/delete', async (req, res) => {
  const { deleteId } = req.body;

  if (!deleteId) {
      return res.status(400).send('Error: ID is missing for deletion.');
  }

  try {
      const result = await deleteDonationInflow(deleteId);
      if (result.rowCount === 0) {
          return res.status(404).send('No record found with the given ID.');
      }

      // Redirect back to the listing page or to another confirmation page
      res.redirect('/donationInflows');
  } catch (error) {
      console.error('Error executing delete query', error);
      res.status(500).send('Internal Server Error');
  }
});


app.get('/donationInflows/add', (req, res) => {
  res.render('addInflow', { title: 'Add New Donation Inflow' });
});


app.post('/donationInflows/create', async (req, res) => {
  const { recordName, organizationID, category, amount, donationDate } = req.body;
  try {

    const addinflow = await addDonationInflow(recordName, organizationID, category, amount, donationDate)

    res.redirect('/donationInflows');
  } catch (err) {
    console.log(error);
 
  }
});

app.get('/donationsearch', async (req, res) => {
  try {
      const { searchTerm, sortby } = req.query;

      // Default sorting if none provided
      let sortOptions = {};
      if (sortby) {
          if (sortby === 'recordName') {
              sortOptions = { recordname: 1 }; // 1 for ascending
          } else if (sortby === 'category') {
              sortOptions = { category: 1 };
          } else if (sortby === 'amount') {
              sortOptions = { amount: 1 };
          } else if (sortby === 'donationDate') {
              sortOptions = { donationdate: 1 };
          }
      }

      if (!searchTerm) {
          // Optional: Redirect or render all donation inflows if no search term is provided
          res.redirect('/'); 
      } else {
          // Assuming getDonationInflowByName can handle an additional sort parameter
          const donationInflows = await getDonationInflowByName(searchTerm, sortOptions);

          console.log(donationInflows);

          if (donationInflows && donationInflows.length > 0) {
              res.render('donationInflowsList.ejs', { donationInflows });
          } else {
              res.render('donationInflowsList.ejs', { donationInflows: [], message: 'No results found' });
          }
      }
  } catch (error) {
      console.error('Search failed:', error);
      res.status(500).send('Error occurred while fetching data');
  }
});

app.get('/sortDonationInflows', async (req, res) => {
  try {
      const { sortby } = req.query;
      let column = 'donationInflowId'; // default column

      if (sortby) {
          switch (sortby) {
              case 'recordName':
                  column = 'recordName';
                  break;
              case 'category':
                  column = 'category';
                  break;
              case 'amount':
                  column = 'amount';
                  break;
              case 'donationDate':
                  column = 'donationDate';
                  break;
              default:
                  res.status(400).send('Invalid sort option');
                  return;
          }
      }

      console.log(`Sorting by column: ${column}`);
      const donationInflows = await fetchSortedDonationInflows(column);
      console.log('Donation Inflows:', donationInflows);
      res.render('donationInflowsList.ejs', { donationInflows });
  } catch (error) {
      console.error('Error in sorting donation inflows:', error);
      res.status(500).send('Error occurred while sorting data');
  }
});

app.get('/donationOutflows', async (req, res) => {
  try {
    const donationOutflow = await fetchDonationOutflows(); // Assuming fetchDonationOutflows is a function to retrieve outflows

    res.render('donationOutflow.ejs', { donationOutflow });

} catch (error) {
    console.error(error);
    res.status(500).send('Server error');
}
});

// Import your database model (assuming it's named DonationOutflow)


app.get('/donationOutflows/edit', async (req, res) => {
try {
  const outflowId = req.query.id; // Retrieve the ID from the query parameters
  console.log(req.body);

  // Proceed with fetching the entity information based on the received ID

  const outflow = await fetchDonationOutflowById(outflowId);
  console.log(outflow);

  if (outflow.length > 0) {
  res.render('editOutflow.ejs', { donationOutflow: outflow[0] }); // Pass only the first element
} else {
  res.status(404).send('Donation outflow not found');
}

  // Render the template with the fetched entity information
} catch (error) {
  console.error('Error fetching donation outflow:', error);
  res.render('error', { message: 'An error occurred' });
}
});


app.post('/donationOutflows/update', async (req, res) => {
const { id, category, amount, donationDate,recordName } = req.body;

if (!id) {
    return res.status(400).send('Error: ID is missing');
}

try {
  const updatedRecord = await updateDonationOutflow(id, { category, amount, donationDate,recordName });

  if (!updatedRecord) {
    return res.status(404).send('No record found with the given ID.');
  }

  // Send the updated record back to the client
  res.redirect('/donationOutflows')
} catch (error) {
  console.error('Error executing update query', error);
  res.status(500).send('Internal Server Error');
}
});
app.get('/error', (req, res) => {
res.status(500).send('Sorry, something went wrong.');
});



app.post('/deleteOutflow', async (req, res) => {
const { deleteId } = req.body;

if (!deleteId) {
    return res.status(400).send('Error: ID is missing for deletion.');
}

try {
    const result = await deleteDonationOutflow(deleteId);
    if (result.rowCount === 0) {
        return res.status(404).send('No record found with the given ID.');
    }

    // Redirect back to the listing page or to another confirmation page
    res.redirect('/donationOutflows');
} catch (error) {
    console.error('Error executing delete query', error);
    res.status(500).send('Internal Server Error');
}
});


app.get('/donationOutflows/add', (req, res) => {
res.render('addOutflow', { title: 'Add New Donation Outflow' });
});


app.post('/donationOutflows/create', async (req, res) => {
const { recordName, organizationID, category, amount, donationDate } = req.body;
try {

  const addoutflow = await addDonationOutflow(recordName, organizationID, category, amount, donationDate)

  res.redirect('/donationOutflows');
} catch (err) {
  console.log(error);

}
});

app.get('/donationsearch', async (req, res) => {
try {
    const { searchTerm, sortby } = req.query;

    // Default sorting if none provided
    let sortOptions = {};
    if (sortby) {
        if (sortby === 'recordName') {
            sortOptions = { recordname: 1 }; // 1 for ascending
        } else if (sortby === 'category') {
            sortOptions = { category: 1 };
        } else if (sortby === 'amount') {
            sortOptions = { amount: 1 };
        } else if (sortby === 'donationDate') {
            sortOptions = { donationdate: 1 };
        }
    }

    if (!searchTerm) {
        // Optional: Redirect or render all donation outflows if no search term is provided
        res.redirect('/'); 
    } else {
        // Assuming getDonationOutflowByName can handle an additional sort parameter
        const donationOutflows = await getDonationOutflowByName(searchTerm, sortOptions);

        console.log(donationOutflows);

        if (donationOutflows && donationOutflows.length > 0) {
            res.render('donationOutflowsList.ejs', { donationOutflows });
        } else {
            res.render('donationOutflowsList.ejs', { donationOutflows: [], message: 'No results found' });
        }
    }
} catch (error) {
    console.error('Search failed:', error);
    res.status(500).send('Error occurred while fetching data');
}
});

app.get('/sortDonationOutflows', async (req, res) => {
try {
    const { sortby } = req.query;
    let column = 'donationOutflowId'; // default column

    if (sortby) {
        switch (sortby) {
            case 'recordName':
                column = 'recordName';
                break;
            case 'category':
                column = 'category';
                break;
            case 'amount':
                column = 'amount';
                break;
            case 'donationDate':
                column = 'donationDate';
                break;
            default:
                res.status(400).send('Invalid sort option');
                return;
        }
    }

    console.log(`Sorting by column: ${column}`);
    const donationOutflows = await fetchSortedDonationOutflows(column);
    console.log('Donation Outflows:', donationOutflows);
    res.render('donationOutflowsList.ejs', { donationOutflows });
} catch (error) {
    console.error('Error in sorting donation outflows:', error);
    res.status(500).send('Error occurred while sorting data');
}
});






app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
