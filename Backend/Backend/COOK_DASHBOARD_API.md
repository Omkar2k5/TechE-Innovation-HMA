# Cook Dashboard API Documentation

## Overview
The cook dashboard provides a real-time view of orders that need to be prepared in the kitchen. It allows cooks to start orders, update item statuses, and track preparation times.

---

## API Endpoints

### 1. Get Kitchen Orders
**Endpoint:** `GET /api/orders/kitchen`  
**Access:** Cook, Manager, Owner  
**Description:** Fetches all active orders for the kitchen (PENDING, PREPARING, READY status only)

**Response:**
```json
{
  "success": true,
  "message": "Kitchen orders retrieved successfully",
  "data": {
    "orders": [
      {
        "orderId": "ORD_xxx",
        "billId": "BILL_xxx",
        "tableId": "T01",
        "orderStatus": "PENDING",
        "priority": "NORMAL",
        "orderedItems": [
          {
            "menuItemId": "68e962482e01eb195f61ffdf",
            "itemName": "paneer tikka",
            "quantity": 2,
            "preparationTimeMinutes": 10,
            "status": "PENDING",
            "startedAt": null,
            "completedAt": null,
            "specialInstructions": "Extra spicy"
          }
        ],
        "orderTime": {
          "placedAt": "2025-10-23T14:00:00Z",
          "startedPreparationAt": null,
          "allItemsReadyAt": null,
          "servedAt": null
        },
        "waiterAssigned": "receptionist@hotel.com",
        "cookAssigned": null,
        "estimatedCompletionTime": "2025-10-23T14:10:00Z",
        "notes": "",
        "isActive": true
      }
    ],
    "stats": {
      "pending": 3,
      "preparing": 2,
      "ready": 1,
      "totalActive": 6
    }
  }
}
```

---

### 2. Start Order Preparation
**Endpoint:** `POST /api/orders/:orderId/start`  
**Access:** Cook, Manager, Owner  
**Description:** Marks an order as started (changes status from PENDING to PREPARING)

**Example:** `POST /api/orders/ORD_1729695600_abc123/start`

**What it does:**
- Changes order status to `PREPARING`
- Sets `orderTime.startedPreparationAt` to current time
- Assigns cook to the order (`cookAssigned`)
- Changes all pending items to `PREPARING` status
- Sets `startedAt` time for each item

**Response:**
```json
{
  "success": true,
  "message": "Order preparation started",
  "data": {
    "order": { /* updated order object */ },
    "updatedAt": "2025-10-23T14:05:00Z"
  }
}
```

---

### 3. Update Order Item Status
**Endpoint:** `PUT /api/orders/:orderId/items/:itemIndex`  
**Access:** Cook, Manager, Owner  
**Description:** Updates the status of a specific item in an order

**Parameters:**
- `orderId`: The order ID (e.g., "ORD_xxx")
- `itemIndex`: The index of the item in the orderedItems array (0-based)

**Request Body:**
```json
{
  "status": "READY"
}
```

**Valid Statuses:**
- `PENDING` - Not started yet
- `PREPARING` - Currently cooking
- `READY` - Finished cooking, ready to serve
- `SERVED` - Already served to customer

**Example:** `PUT /api/orders/ORD_1729695600_abc123/items/0`

**What it does:**
- Updates the item status
- Sets `startedAt` when status changes to `PREPARING`
- Sets `completedAt` when status changes to `READY`
- If all items are `READY`, updates order status to `READY`
- Sets `orderTime.allItemsReadyAt` when all items ready

**Response:**
```json
{
  "success": true,
  "message": "Order item updated successfully",
  "data": {
    "order": { /* updated order object */ },
    "updatedItem": { /* the item that was updated */ },
    "allReady": false
  }
}
```

---

## Frontend Integration

### Cook Queue Component (`Queue.jsx`)

#### Features:
1. **Real-time Polling:** Fetches orders every 5 seconds
2. **Priority Sorting:** Orders sorted by priority (HIGH → NORMAL → LOW)
3. **Start Order Button:** Shows for PENDING orders to begin preparation
4. **Item Status Buttons:** Toggle between PREPARING and READY
5. **Preparation Time Display:** Shows estimated prep time for each item
6. **Special Instructions:** Displays any customer notes
7. **Notifications:** Sound and browser notifications when orders complete
8. **Shortage Reporting:** Report ingredient shortages

#### Status Flow:

```
PENDING → Click "Start Preparing" → PREPARING → Click "Cooking" → PREPARING
                                                     ↓
                                              Click "✓ Ready" → READY
```

#### Visual Indicators:

**Order Priority:**
- `URGENT` - Red badge
- `HIGH` - Orange badge
- `NORMAL` - Gray badge (no badge shown)

**Item Status:**
- `PENDING` - Amber background
- `PREPARING` - Blue background
- `READY` - Green background

**Order Card Shows:**
- Table number
- Order ID (shortened)
- Time since order placed
- Estimated completion time
- Priority badge (if not NORMAL)
- Start button (if PENDING)
- Individual items with prep times
- Special instructions (if any)

---

## Workflow Example

### Example: Cook receives a new order

1. **Order appears in queue:**
   - Shows as PENDING status
   - "Start Preparing" button visible
   - Shows table number and estimated time

2. **Cook clicks "Start Preparing":**
   - API: `POST /api/orders/ORD_xxx/start`
   - Order status changes to PREPARING
   - All items marked as PREPARING
   - Cook's name assigned to order
   - Start time recorded

3. **Cook updates item status:**
   - Item shows with "Cooking" and "✓ Ready" buttons
   - Click "Cooking" → Confirms item is being prepared
   - Click "✓ Ready" → Marks item as ready
   - API: `PUT /api/orders/ORD_xxx/items/0` with `{"status": "READY"}`

4. **All items ready:**
   - Order status automatically changes to READY
   - Completion time recorded
   - Sound notification plays
   - Browser notification shown
   - "Notify Manager" button appears

5. **Order served:**
   - Receptionist marks order as SERVED
   - Order disappears from cook's queue
   - Only shows PENDING, PREPARING, READY orders

---

## Timer Display

The cook dashboard shows a live timer for each order:
- Format: `MM:SS` (e.g., "05:23")
- Updates every second
- Shows time elapsed since order was placed
- Helps cook prioritize older orders

---

## Benefits

### For Cooks:
- Clear view of what needs to be prepared
- Track preparation progress item by item
- See preparation time estimates
- Priority-based queue
- Special instructions visible

### For Management:
- Real-time kitchen status
- Track preparation times
- Monitor cook efficiency
- Historical data for analysis

### For Customers:
- More accurate preparation times
- Better order tracking
- Special instructions honored
- Improved service quality

---

## Notes

- Orders auto-refresh every 5 seconds
- Only shows active orders (not SERVED or CANCELLED)
- Cook can be assigned to multiple orders
- Preparation times pulled from menu items
- All times stored in UTC, displayed in local time
