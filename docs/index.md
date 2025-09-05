# Understanding Keys, Indexes, and the "Too Many Keys" Error in MySQL + Sequelize

## What Happened

While working with Sequelize and MySQL, hit this error:

```

Error: Too many keys specified; max 64 keys allowed

```

It happened on the `Cities` table when Sequelize tried to apply this:

```sql
ALTER TABLE `Cities` CHANGE `name` `name` VARCHAR(255) NOT NULL UNIQUE;
```

When inspected the table, found **64 indexes** on the same column `name`:

- `name`
- `name_2`
- `name_3`
- ...
- `name_63`

That’s why MySQL refused to add another — it has a hard limit of **64 keys per table**.

---

## What Are Keys and Indexes?

Think of a database like a huge book:

- **Column** → like a chapter title ("City name", "Country").
- **Index** → like the back-of-the-book index. It helps MySQL **find rows faster**.
- **Primary Key** → the main ID of each row (like a passport number). Must be unique.
- **Unique Key** → ensures no duplicate values in a column (e.g., two cities can’t both be called "Paris" in the same table).
- **Foreign Key** → ensures a column matches an existing row in another table (e.g., a city belongs to a country).
- **Constraint** → a rule you place on a column (`NOT NULL`, `UNIQUE`, etc.).

Every **unique**, **primary**, and **foreign key** creates an **index under the hood**.

---

## Without an Index

Imagine you have a huge table Cities with 10 million rows.
If you run:

SELECT \* FROM Cities WHERE name = 'Paris';

MySQL must scan every single row until it finds "Paris".
This is called a full table scan.
It’s like searching for “Paris” in a book by reading every page one by one.

## With an Index

Now suppose name has an index (like UNIQUE in your case).
Indexes in MySQL are usually implemented as a B-tree (balanced tree data structure).

The index stores the values of the column (Paris, London, Tokyo, …) in sorted order.

Along with each value, it stores a pointer to the exact row in the table.

So when you search for "Paris", MySQL doesn’t scan the whole table.
Instead, it navigates the tree (like looking in a book’s index at the back).

Result: MySQL finds "Paris" in logarithmic time (O(log n)) instead of linear time (O(n)).

For millions of rows, this is the difference between milliseconds vs minutes.

## Why Did We Get 64 Indexes?

- In the Sequelize model, `name` was defined as:

  ```js
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
  ```

- Sequelize’s `sync()` method looks at this and says:

  > "Make sure there’s a UNIQUE index on `name`."

- But Sequelize doesn’t always detect that an index already exists.
  Each time `sync()` runs, it tries to add another index.

- MySQL allows duplicate unique indexes (as long as they have different names), so it auto-renames them: `name`, `name_2`, `name_3`, … until the table hit **64 indexes**.

---

## Why Is This Bad?

- Performance issues: unnecessary indexes slow down writes (inserts/updates).
- Storage waste: MySQL maintains all those indexes.
- Migration pain: hitting MySQL’s **64-index limit** blocks schema changes.

---

## How To Fix

### 1. Clean Up the Table

Drop all duplicate indexes and keep just one:

```sql
ALTER TABLE Cities
  DROP INDEX name,
  DROP INDEX name_2,
  DROP INDEX name_3,
  ...
  DROP INDEX name_63;

ALTER TABLE Cities
  ADD UNIQUE INDEX uq_city_name (name);
```

Now you’ll have exactly **one clean unique index** on `name`.

---

### 2. Fix the Sequelize Model

Keep the uniqueness rule in your model:

```js
const City = sequelize.define("City", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
});
```

But avoid `sequelize.sync({ alter: true })` in production — it’s what caused duplicates.

---

### 3. Use Migrations (Best Practice)

With Sequelize CLI, define the unique index **once**:

```js
await queryInterface.addConstraint("Cities", {
  fields: ["name"],
  type: "unique",
  name: "uq_city_name",
});
```

This way:

- The constraint is tracked in your migrations.
- Sequelize doesn’t keep re-adding it.

---

## Key Takeaways

- MySQL allows **max 64 indexes per table**.
- Every `PRIMARY KEY`, `UNIQUE`, and `FOREIGN KEY` creates an index.
- Using `sync({ alter: true })` in Sequelize can accidentally add duplicate indexes.
- Prefer **migrations** over `sync()` for production databases.
- Always check existing indexes with:

  ```sql
  SHOW INDEXES FROM Cities;
  ```
