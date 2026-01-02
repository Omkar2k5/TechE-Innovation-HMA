# Orders and Bills Structure Documentation

## Overview
The system now separates order management (kitchen operations) from billing (payment tracking) into two distinct collections.

## Database Collections

### 1. Orders Collection (Kitchen-Focused)
**Purpose:** Track order preparation and cooking status for the kitchen staff.

**Document Structure:**
```javascript
{
  _id: "HOTEL_ID",  // e.g., "ASD001"
  hotelName: "Hotel Name",
  orders: [
    {
      orderId: "ORD_xxx",
      billId: "BILL_xxx",  // Reference to associated bill
      tableId: "T01",
      orderStatus: "PENDING | PREPARING | READY | SERVED | CANCELLED",
      priority: "LOW | NORMAL | HIGH | URGENT",
      orderedItems: [
        {
          menuItemId: "68e962482e01eb195f61ffdf",
          itemName: "paneer tikka",
          quantity: 2,
          preparationTimeMinutes: 10,
          status: "PENDING | PREPARING | READY | SERVED",
          startedAt: null,
          completedAt: null,
          specialInstructions: "Extra spicy"
        }
      ],
      orderTime: {
        placedAt: Date,
        startedPreparationAt: Date,
        allItemsReadyAt: Date,
        servedAt: Date
      },
      waiterAssigned: "user@example.com",
      cookAssigned: "cook@example.com",
      estimatedCompletionTime: Date,
      notes: "Customer notes",
      isActive: true
    }
  ]
}
```

**Key Features:**
- Track preparation time for each item
- Monitor cooking status (PENDING → PREPARING → READY → SERVED)
- Assign cooks to orders
- Calculate estimated completion times
- Priority-based order queue

---

### 2. Bills Collection (Payment-Focused)
**Purpose:** Track billing, payments, and financial transactions.

**Document Structure:**
```javascript
{
  _id: "HOTEL_ID",  // e.g., "ASD001"
  hotelName: "Hotel Name",
  bills: [
    {
      billId: "BILL_xxx",
      orderId: "ORD_xxx",  // Reference to associated order
      tableId: "T01",
      customerInfo: {
        name: "John Doe",
        phone: "1234567890",
        groupSize: 4
      },
      items: [
        {
          menuItemId: "68e962482e01eb195f61ffdf",
          itemName: "paneer tikka",
          quantity: 2,
          unitPrice: 100,
          totalPrice: 200
        }
      ],
      paymentDetails: {
        subtotal: 200,
        tax: 10,           // 5%
        serviceCharge: 4,  // 2%
        discount: 0,
        grandTotal: 214,
        paymentMethod: "CASH | CARD | UPI | OTHER",
        paymentStatus: "PAID | PENDING | CANCELLED",
        paidAmount: 214,
        changeAmount: 0,
        paidAt: Date
      },
      waiterAssigned: "user@example.com",
      billGeneratedAt: Date,
      isActive: true,
      notes: "Bill notes"
    }
  ]
}
```

**Key Features:**
- Itemized billing with prices
- Tax and service charge calculation
- Payment tracking (status, method, amounts)
- Customer information
- Discount management

---

## API Endpoints

### Orders API (`/api/orders`)

#### Create Order (POST `/api/orders`)
Creates both order and bill simultaneously.

**Request:**
```javascript
{
  "tableId": "T01",
  "customer": {
    "name": "John Doe",
    "phone": "1234567890",
    "groupSize": 4
  },
  "items": [
    {
      "menuItemId": "68e962482e01eb195f61ffdf",
      "name": "paneer tikka",
      "quantity": 2,
      "unitPrice": 100,
      "specialInstructions": "Extra spicy"
    }
  ],
  "priority": "NORMAL",
  "notes": "Customer notes"
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Order and bill created successfully",
  "data": {
    "orderId": "ORD_xxx",
    "billId": "BILL_xxx",
    "order": { /* order object */ },
    "bill": { /* bill object */ },
    "estimatedCompletionTime": "2025-10-23T14:30:00Z"
  }
}
```

#### Get All Orders (GET `/api/orders`)
Fetches all orders for the hotel (kitchen view).

#### Update Order Status (PUT `/api/orders/:orderId`)
Update order preparation status (for kitchen staff).

---

### Bills API (`/api/bills`)

#### Get All Bills (GET `/api/bills`)
Fetches all bills for the hotel.

**Response includes statistics:**
- Total bills
- Pending payments
- Paid bills
- Total revenue
- Pending amount

#### Get Bill by ID (GET `/api/bills/:billId`)
Fetch specific bill details.

#### Update Payment (PUT `/api/bills/:billId/payment`)
Process payment for a bill.

**Request:**
```javascript
{
  "paymentMethod": "CASH",
  "paymentStatus": "PAID",
  "paidAmount": 214,
  "discount": 0
}
```

#### Get Bills by Table (GET `/api/bills/table/:tableId`)
Get all bills for a specific table.

---

## Workflow

### 1. Taking an Order (Receptionist)
1. Receptionist takes order from customer
2. POST to `/api/orders` with items and table info
3. System creates:
   - Order document (for kitchen) with prep times
   - Bill document (for payment) with prices
4. Kitchen receives order with preparation details
5. Bill is ready for payment processing

### 2. Preparing Order (Cook)
1. Cook views orders via `/api/orders`
2. Starts preparing: Update item status to "PREPARING"
3. Completes item: Update item status to "READY"
4. All items ready: Update order status to "READY"
5. After serving: Update order status to "SERVED"

### 3. Payment Processing (Receptionist/Cashier)
1. Customer ready to pay
2. Fetch bill via `/api/bills/:billId` or `/api/bills/table/:tableId`
3. Apply discount if needed
4. Process payment via PUT `/api/bills/:billId/payment`
5. Bill status changes to "PAID"

---

## Key Benefits

### Separation of Concerns
- **Kitchen Staff:** Focus on order preparation, timing, and cooking status
- **Front Desk:** Focus on customer service and order taking
- **Cashier:** Focus on billing and payments

### Performance
- Kitchen queries don't need payment data
- Payment queries don't need preparation details
- Indexed separately for optimal performance

### Scalability
- Can scale kitchen operations independently
- Can add multiple cooks without affecting billing
- Easy to add features like kitchen display systems

### Data Integrity
- Order and bill are linked via IDs
- Even if one is modified, the other maintains its integrity
- Clear audit trail for both preparation and payment

---

## Migration Notes

If you have existing orders in the old format:
1. Existing orders contain both preparation and payment data
2. New orders will be split into orders and bills collections
3. You may need to write a migration script to split old orders
4. Ensure frontend is updated to handle new structure

---

## Frontend Updates Required

### Receptionist Dashboard
- ✅ Already updated to send correct format
- Uses `/api/orders` to create orders
- Response includes both orderId and billId

### Kitchen Display (Future)
- Use `/api/orders` to show pending/preparing orders
- Update order item status as cooking progresses
- Display preparation times and priorities

### Billing/Payment Page (Future)
- Use `/api/bills` to fetch bills
- Show itemized bills with prices
- Process payments with discount options
