# Cook Dashboard Timer System

## Overview
The cook dashboard now has a dual-timer system that shows different information based on the order status.

---

## Timer Types

### 1. Elapsed Timer (Always Visible)
**Shows:** Time since order was received  
**Format:** `MM:SS` (e.g., "05:23")  
**Color:** Gray text  
**Purpose:** Track how long the order has been waiting

**Display:**
```
🕐 Received: 05:23
```

---

### 2. Countdown Timer (Shows When Cooking)
**Shows:** Time remaining until estimated completion  
**Format:** `MM:SS` or `+MM:SS OVERTIME`  
**Colors:**
- **Blue:** Normal (>1 minute remaining)
- **Orange:** Warning (<1 minute remaining)
- **Red:** Overtime (past estimated time)

**Display:**
```
⚡ Time Left: 08:45  (Normal)
⚡ Time Left: 00:45  (Warning - under 1 min)
⚡ Time Left: +02:15 OVERTIME  (Overdue)
```

---

## Timer Behavior by Order Status

### PENDING Status
**What Shows:**
- ✅ Elapsed timer (time since received)
- ✅ Estimated completion time (static)
- ❌ NO countdown timer

**Example:**
```
Table T01
🕐 Received: 03:12
Est. completion: 2:45 PM
```

**Why:** Order hasn't started cooking yet, so countdown hasn't begun.

---

### PREPARING Status (After "Start Preparing" Clicked)
**What Shows:**
- ✅ Elapsed timer (time since received)
- ✅ **Countdown timer** (time until done)
- ❌ No static estimated time

**Example:**
```
Table T01
🕐 Received: 03:12
⚡ Time Left: 08:45
```

**What Happens:**
1. Cook clicks "🔥 Start Preparing Order"
2. Backend records `startedPreparationAt` timestamp
3. Backend recalculates `estimatedCompletionTime` from NOW + prep time
4. Countdown timer starts showing time remaining
5. Timer color changes based on remaining time

---

### READY Status
**What Shows:**
- ✅ Elapsed timer
- ✅ Countdown timer (showing overtime if any)

**Example:**
```
Table T01
🕐 Received: 15:32
⚡ Time Left: +01:23 OVERTIME
```

---

## Backend Changes

### When Order is Created (POST /api/orders)
```javascript
// Initial estimated completion (from order placed time)
const estimatedCompletion = new Date();
estimatedCompletion.setMinutes(estimatedCompletion.getMinutes() + maxPrepTime);
order.estimatedCompletionTime = estimatedCompletion;
```

### When Cooking Starts (POST /api/orders/:orderId/start)
```javascript
// RECALCULATE from actual start time
const startTime = new Date();
order.orderTime.startedPreparationAt = startTime;

// Find maximum prep time
let maxPrepTime = 0;
order.orderedItems.forEach(item => {
  if (item.preparationTimeMinutes > maxPrepTime) {
    maxPrepTime = item.preparationTimeMinutes;
  }
});

// NEW estimated completion from NOW
const newEstimatedCompletion = new Date(startTime);
newEstimatedCompletion.setMinutes(newEstimatedCompletion.getMinutes() + maxPrepTime);
order.estimatedCompletionTime = newEstimatedCompletion;
```

**Key Point:** The estimated completion time is recalculated based on when the cook ACTUALLY starts cooking, not when the order was placed.

---

## Frontend Components

### ElapsedTimer Component
```javascript
const ElapsedTimer = ({ since }) => {
  // Calculates: NOW - since
  // Shows time elapsed since 'since' timestamp
  // Always counts UP
}
```

### CountdownTimer Component
```javascript
const CountdownTimer = ({ estimatedCompletionTime }) => {
  // Calculates: estimatedCompletionTime - NOW
  // Shows time remaining until completion
  // Counts DOWN to zero, then shows overtime
  
  // Colors:
  // - Blue: > 60 seconds
  // - Orange: < 60 seconds
  // - Red: Negative (overtime)
}
```

---

## User Experience

### Scenario 1: Order Just Arrived
```
Order received at 2:30 PM
Max prep time: 15 minutes

Display:
🕐 Received: 00:15
Est. completion: 2:45 PM
[🔥 Start Preparing Order] button
```

### Scenario 2: Cook Starts After 5 Minutes
```
Order received at 2:30 PM
Cook starts at 2:35 PM (5 min late)
Max prep time: 15 minutes

Display:
🕐 Received: 05:00
⚡ Time Left: 15:00  (NEW countdown from NOW + 15 min = 2:50 PM)
```

### Scenario 3: Cooking Almost Done
```
Time now: 2:49 PM
Estimated completion: 2:50 PM

Display:
🕐 Received: 19:00
⚡ Time Left: 00:45  (Warning - Orange)
```

### Scenario 4: Running Late
```
Time now: 2:52 PM
Estimated completion: 2:50 PM

Display:
🕐 Received: 22:00
⚡ Time Left: +02:00 OVERTIME  (Red)
```

---

## Benefits

### For Cooks:
- ✅ Clear countdown showing exactly how much time left
- ✅ Visual warnings when running out of time
- ✅ Overtime indicator for late orders
- ✅ Accurate timing based on when they ACTUALLY start

### For Management:
- ✅ Track actual cooking times vs estimates
- ✅ Identify consistently late cooks
- ✅ Identify items that take longer than estimated
- ✅ Better customer service with accurate timing

### For Customers:
- ✅ More accurate delivery times
- ✅ Reduced waiting time confusion
- ✅ Better kitchen efficiency

---

## Timer Update Frequency

Both timers update **every 1 second** for accurate real-time display.

---

## Color Coding

| Condition | Color | Meaning |
|-----------|-------|---------|
| Countdown > 60s | Blue | Normal, plenty of time |
| Countdown < 60s | Orange | Warning, less than 1 minute |
| Countdown < 0 | Red | Overtime, running late |
| Elapsed | Gray | Information only |

---

## Future Enhancements

1. **Audio Alerts:** Play sound when timer hits 1 minute
2. **Push Notifications:** Alert when order goes into overtime
3. **Statistics:** Track average overtime per cook
4. **Performance Metrics:** Compare actual time vs estimated time
5. **Item-Level Timers:** Individual countdown for each dish
