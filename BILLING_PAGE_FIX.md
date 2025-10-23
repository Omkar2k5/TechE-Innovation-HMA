# Billing Page Fix - Payment Status Update

## Issue
The billing page was unable to update payment status because:
1. It was calling `/orders/:orderId/billing` endpoint which doesn't exist
2. It wasn't fetching bills data from the bills collection
3. Orders and bills are now in separate collections

## Solution Implemented

### 1. Updated API Endpoint
**Changed from:**
```javascript
api.put(`/orders/${orderId}/billing`, billingData)
```

**Changed to:**
```javascript
api.put(`/bills/${order.billId}/payment`, {
  paymentMethod: billingData.paymentMethod,
  paymentStatus: billingData.paymentStatus,
  paidAmount: billingData.paidAmount,
  discount: billingData.discount
})
```

### 2. Fetch Both Orders and Bills
The billing page now fetches both collections and merges them:

```javascript
const [ordersResponse, billsResponse] = await Promise.all([
  api.get('/orders'),
  api.get('/bills')
]);

// Merge orders with bills data
const mergedOrders = ordersData.map(order => {
  const bill = billsMap[order.orderId];
  return {
    ...order,
    billDetails: bill ? bill.paymentDetails : { ... },
    billId: bill ? bill.billId : null
  };
});
```

### 3. Data Structure
Each order now has:
- `billId` - Reference to the bill
- `billDetails` - Payment details from bills collection
  - `subtotal`
  - `tax`
  - `serviceCharge`
  - `grandTotal`
  - `paymentStatus` (PENDING/PAID)
  - `paymentMethod` (CASH/CARD/UPI/OTHER)
  - `paidAmount`
  - `changeAmount`

## How It Works Now

1. **Page Load:**
   - Fetches orders from `/api/orders`
   - Fetches bills from `/api/bills`
   - Merges them by `orderId`

2. **View Order:**
   - Shows order details (items, times, waiter)
   - Shows billing details (prices, payment status)

3. **Update Payment:**
   - User selects payment method
   - Clicks "Mark as Paid"
   - Calls `/api/bills/:billId/payment` with payment data
   - Bill status updates to PAID
   - Page refreshes to show updated data

## API Endpoints Used

### Get Orders
- **Endpoint:** `GET /api/orders`
- **Returns:** Order details (items, times, status)

### Get Bills
- **Endpoint:** `GET /api/bills`
- **Returns:** Billing details (prices, payment status)

### Update Payment
- **Endpoint:** `PUT /api/bills/:billId/payment`
- **Body:**
  ```json
  {
    "paymentMethod": "CASH|CARD|UPI|OTHER",
    "paymentStatus": "PAID",
    "paidAmount": 214,
    "discount": 0
  }
  ```

## Testing

1. Login as receptionist
2. Go to "Orders & Billing" page
3. View an order with pending payment
4. Select payment method (Cash/Card/UPI)
5. Click "Mark as Paid"
6. Payment status should update to PAID
7. Payment method should be displayed

## Notes

- Orders collection: Kitchen operations (preparation, cooking)
- Bills collection: Financial operations (pricing, payment)
- Both linked by `orderId` and `billId`
- Frontend merges data for display
- Separate collections allow independent scaling
