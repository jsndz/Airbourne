## 1. What is a Transaction?

A **transaction** is a sequence of database operations executed as a **single atomic unit**.

* **Commit:** All operations succeed → changes saved to the database.
* **Rollback:** Any operation fails → all changes undone.

This ensures **data consistency**.

Example use case: Booking a flight

1. Check available seats
2. Create booking
3. Update booking status

All must happen together; if one fails, **nothing should change**.

---

## 2. MySQL Support

* MySQL supports transactions **only in InnoDB tables**.
* MyISAM tables **do not support transactions**.

```sql
SHOW TABLE STATUS WHERE Name = 'flights';
-- Check the "Engine" column, should be InnoDB
```

---

## 3. Sequelize Transaction Basics

### Manual Transaction

```js
const { sequelize } = require('../models/index');

const t = await sequelize.transaction(); // start transaction

try {
    await Booking.create({ flightId: 1, seats: 2 }, { transaction: t });
    await Booking.update({ status: 'Booked' }, { where: { id: 1 }, transaction: t });

    await t.commit();  // commit changes
} catch (error) {
    await t.rollback(); // rollback on error
}
```

**Key Points:**

* Pass the transaction object `t` to all Sequelize operations.
* Commit if all succeed, rollback on failure.

---

### Managed Transaction

Sequelize can manage commit/rollback automatically:

```js
const finalBooking = await sequelize.transaction(async (t) => {
    const booking = await Booking.create({ flightId: 1, seats: 2 }, { transaction: t });
    return await Booking.update({ status: 'Booked' }, { where: { id: booking.id }, transaction: t });
});
```

* No need to manually call `commit()` or `rollback()`.
* Automatically rolls back if an error occurs inside the callback.

---

## 4. Using Transactions in Repository Layer

### BookingRepository

```js
class BookingRepository {
    async create(data, t) {
        return await Booking.create(data, { transaction: t });
    }

    async update(bookingId, data, t) {
        const booking = await Booking.findByPk(bookingId, { transaction: t });
        if (data.status) booking.status = data.status;
        await booking.save({ transaction: t });
        return booking;
    }
}
```

**Notes:**

* All DB operations accept a `transaction` parameter.
* This ensures the repository methods can participate in the same transaction.

---

## 5. Using Transactions in Service Layer

### BookingService Example

```js
const { BookingRepository } = require('../repository/index');
const { sequelize } = require('../models/index');

class BookingService {
    constructor() {
        this.bookingRepository = new BookingRepository();
    }

    async createBooking(data) {
        const t = await sequelize.transaction(); // start transaction
        try {
            const booking = await this.bookingRepository.create(data, t);
            const finalBooking = await this.bookingRepository.update(booking.id, { status: 'Booked' }, t);

            await t.commit();  // commit if all succeeds
            return finalBooking;
        } catch (error) {
            await t.rollback(); // rollback on error
            throw error;
        }
    }
}
```

**Explanation:**

1. **Start a transaction** at the beginning.
2. **Pass `t` to all repository operations**.
3. **Commit** if all operations succeed.
4. **Rollback** if any error occurs.

---

### Using Managed Transactions in Service

```js
const finalBooking = await sequelize.transaction(async (t) => {
    const booking = await this.bookingRepository.create(data, t);
    return await this.bookingRepository.update(booking.id, { status: 'Booked' }, t);
});
```

* Cleaner and safer.
* Sequelize handles commit/rollback automatically.

---

## 6. Important Notes

1. **Always pass transaction object `t`** to all Sequelize calls involved in the atomic operation.
2. **External APIs** (like flight seat updates via HTTP) cannot be rolled back automatically.

   * Consider **retry mechanisms** or **compensating actions**.
3. **RabbitMQ / message queues** should be invoked **after transaction commits** to ensure messages reflect successful operations.

---

## 7. Complete Example with External API and RabbitMQ

```js
async createBooking(data){
        const t = await sequelize.transaction();
        try {

            const flightId = data.flightId;
            let getFlightRequestURL = `${FLIGHT_SERVICE_PATH}/api/v1/flights/${flightId}`;
            const response = await axios.get(getFlightRequestURL);
            let flightData =response.data.data;
            let priceOfTheFlight = flightData.price;
            if (data.NoOfSeats > flightData.totalSeats){
                throw new ServiceError('something went wrong in booking process','insufficient seats')
            }
            const totalCost = priceOfTheFlight * data.NoOfSeats;
            const bookingPayload = {...data,totalCost};
            const booking = await this.bookingRepository.create(bookingPayload,t);
            const updateflightrequestURL = `${FLIGHT_SERVICE_PATH}/api/v1/flights/${booking.flightId}`;
            await axios.patch(updateflightrequestURL,{totalSeats: flightData.totalSeats- booking.NoOfSeats});
            const finalBooking = await this.bookingRepository.update(booking.id,{status : "Booked"},t)
            await t.commit();

            return finalBooking;

        } catch (error) {
            await t.rollback();
            if(error.name == 'ValidationError' || error.name == 'repositoryERROR'){
                throw error;
            }
            throw new ServiceError();
    }
}
```

**Flow:**

1. DB operations inside transaction → atomic
2. Commit or rollback automatically
3. External API call after DB commit
4. Publish RabbitMQ message after DB commit

---

