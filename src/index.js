const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

const customers = [];

function verifyCustomerExists(request, response, next) {
  const { document } = request.headers;
  const customer = customers.find((customer) => customer.document === document);

  if (!customer) {
    return response.status(400).json({ error: "Customer not found!" });
  }

  request.customer = customer;
  return next();
}

function getCustomerBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === "credit") {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);
  return balance;
}

app.post("/account", (request, response) => {
  const { document, name } = request.body;

  const customerAlreadyExists = customers.find((customer) => customer.document === document);

  if (customerAlreadyExists) {
    return response.status(400).json({ error: "Customer already exists!" });
  }

  const newCustomer = {
    id: uuidv4(),
    document,
    name,
    statement: [],
  };
  customers.push(newCustomer);

  return response.status(201).send();
});

app.use(verifyCustomerExists);

app.get("/statement", (request, response) => {
  const { customer } = request;
  return response.json(customer.statement);
});

app.post("/deposit", (request, response) => {
  const { customer } = request;
  const { amount, description } = request.body;

  const deposit = {
    id: uuidv4,
    type: "credit",
    amount,
    description,
    created_at: new Date(),
  };

  customer.statement.push(deposit);

  return response.status(201).send();
});

app.post("/withdraw", (request, response) => {
  const { customer } = request;
  const { amount } = request.body;

  const balance = getCustomerBalance(customer.statement);
  if (balance < amount) {
    return response.status(400).json({ error: "Operation fail, insufficient funds!" });
  }

  const withdraw = {
    id: uuidv4,
    type: "debit",
    amount,
    created_at: new Date(),
  };

  customer.statement.push(withdraw);

  return response.status(201).send();
});

app.get("/statement/date", (request, response) => {
  const { customer } = request;
  const { date } = request.query;

  const dateFormat = new Date(date + " 00:00");

  const statement = customer.statement.filter(
    (statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString()
  );

  return response.json(statement);
});

app.put("/account", (request, response) => {
  const { customer } = request;
  const { name } = request.body;

  customer.name = name;

  return response.status(201).send();
});

app.get("/account", (request, response) => {
  const { customer } = request;
  return response.json(customer);
});

app.get("/balance", (request, response) => {
  const { customer } = request;
  const balance = getCustomerBalance(customer.statement);

  return response.json(balance);
});

app.delete("/account", (request, response) => {
  const { customer } = request;
  customers.splice(customer, 1);

  return response.status(202).send();
});

app.listen(3333);
