import staticPlugin from "@elysiajs/static";
import { Elysia } from "elysia";
import { createClient } from "@libsql/client";
import { v4 as uuidv4 } from "uuid";
import 'dotenv/config';

// Set up Turso client
const client = createClient({
  url: process.env.TURSO_URL || "",
  authToken: process.env.TURSO_AUTH_TOKEN
})

async function getPeople() {
  // Get a list of all people
  try {
    const response = await client.execute("select * from person");

    // Return HTML to work with HTMX
    let returnHTML = '<option value="">Select</option>';
    response.rows.forEach((row) => {
      returnHTML += `<option value="${row.id}">${row.name}</option>`
    });
    return returnHTML;
  } catch (e) {
    console.error(e);
  }
}

async function getPerson({ params: { id } }) {
  // Get a single person
  try {
    const response = await client.execute({
      sql: "select * from person where id = ?",
      args: [id]
    });
    return response.rows;
  } catch (e) {
    console.error(e);
  }
}

async function addPerson({ body }) {
  // Add a new person
  try {
    const id = uuidv4();
    const budget = 0;
    let response = await client.execute({
      sql: "insert into person values (?, ?, ?)",
      args: [id, body.recipientName, budget]
    });
    response = await client.execute("select * from person");
    
    // Return HTML to work with HTMX
    let returnHTML = '<option value="">Select</option>';
    response.rows.forEach((row) => {
      returnHTML += `<option value="${row.id}">${row.name}</option>`
    });
    return new Response(returnHTML, {
      headers: {
        'Content-Type': 'text/html',
        'HX-Trigger': 'returnPersonEvent'
      }
    });
  } catch (e) {
    console.error(e);
  }
  return 'Error';
}

async function getPersonGifts({ params: { personId } }) {
  // Get the gifts for one person
  try {
    const response = await client.execute({
      sql: "select id, item_name, price, purchased from gift where person_id = ?",
      args: [personId]
    });
    return response.rows;
  } catch (e) {
    console.error(e);
  }
}

async function deleteGift({ params: { giftId } }) {
  // Delete a gift
  try {
    const response = await client.execute({
      sql: "delete from gift where id = ?",
      args: [giftId]
    });
    return response;
  } catch (e) {
    console.error(e)
  }
}

async function addGift({ body }) {
  // Add a new gift
  try {
    const id = uuidv4();
    const purchased = body.purchased ? 1 : 0;
    const response = await client.execute({
      sql: "insert into gift values (?, ?, ?, ?, ?)",
      args: [id, body.personId, body.itemName, body.price, purchased]
    });
    
    // Response that triggers event using HTMX
    return new Response(
      JSON.stringify(response),
      {
        headers: {
          'Content-Type': 'application.json',
          'HX-Trigger': 'reloadGifts'
        }
      }
    );
  } catch (e) {
    console.error(e);
  }
  return 'Error';
}

async function purchaseGift({ params: { giftId } }) {
  // Update a gift (only purchased column can be updated currently)
  try {
    const response = await client.execute({
      sql: "update gift set purchased = 1 where id = ?",
      args: [giftId]
    });
    return response;
  } catch (e) {
    console.error(e)
  }
}

async function editBudget({ body }) {
  // Update person (only budget can be updated currently)
  try {
    let response = await client.execute({
      sql: "update person set budget = ? where id = ?",
      args: [body.budget, body.id]
    })
    // Return the new budget
    response = await client.execute({
      sql: "select budget from person where id = ?",
      args: [body.id]
    })
    return response.rows[0].budget;
  } catch (e) {
    console.error(e)
  }
}

const app = new Elysia()
  .use(staticPlugin())
  .get('/', () => Bun.file('public/index.html'))
  .get('/person', getPeople)
  .get('/person/:id', getPerson)
  .post('/person', addPerson)
  .put('/person', editBudget)
  .get('/gift/:personId', getPersonGifts)
  .delete('/gift/:giftId', deleteGift)
  .post('/gift', addGift)
  .put('/gift/:giftId', purchaseGift)
  .get('/ping', () => 'pong')
  .post('/ping', () => 'pong')
  .listen(8000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
