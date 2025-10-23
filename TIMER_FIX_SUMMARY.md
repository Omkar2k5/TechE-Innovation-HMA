# Cook Dashboard Timer Fix

## Issue
The timer system was not working correctly:
- ❌ Received timer was starting from wrong time
- ❌ Countdown timer was appearing before cooking started
- ❌ Countdown timer was not stopping when order was ready

## Solution Implemented

### 1. Received Timer (Elapsed Timer)
**Always Running** - Shows time since order was created

**Behavior:**
- ✅ Starts counting when order is **CREATED** (`orderTime.placedAt`)
- ✅ Continues running regardless of order status
- ✅ Never stops (always shows how long ago order was received)
- ✅ Gray color (informational)

**Example:**
```
Order created at 2:30 PM
Current time: 2:45 PM
Display: 🕐 Received: 15:00
```

---

### 2. Countdown Timer (Time Left)
**Conditional Display** - Only shows when cooking has started

**When it appears:**
- ✅ Order status is NOT `PENDING`
- ✅ Cook has clicked "Start Preparing" (`startedPreparationAt` exists)
- ✅ Estimated completion time exists

**When it DOESN'T appear:**
- ❌ Order is still `PENDING` (not started yet)
- ❌ No `startedPreparationAt` timestamp
- ❌ Show static prep time instead

**Behavior:**
- ✅ Starts counting down when "Start Preparing" is clicked
- ✅ Shows time remaining until estimated completion
- ✅ **STOPS** when order status becomes `READY` or `SERVED`
- ✅ Shows "COMPLETED" in green when stopped
- ✅ Color-coded by urgency:
  - 🔵 Blue: >60 seconds remaining
  - 🟠 Orange: <60 seconds remaining
  - 🔴 Red: Overtime (past deadline)

**Example:**
```
Order started at 2:35 PM
Est. completion: 2:50 PM (15 min prep)
Current time: 2:40 PM
Display: ⚡ Time Left: 10:00

When ready:
Display: ⚡ Time Left: COMPLETED ✓
```

---

## Status-Based Display

### PENDING Status (Order Not Started)
```
Table T01
🕐 Received: 05:23
Est. time: 15 min

[🔥 Start Preparing Order] button
```

**What shows:**
- ✅ Received timer (elapsed since created)
- ✅ Static estimated prep time in minutes
- ❌ NO countdown timer
- ✅ "Start Preparing" button

---

### PREPARING Status (Cooking Started)
```
Table T01
🕐 Received: 08:45
⚡ Time Left: 12:30
```

**What shows:**
- ✅ Received timer (elapsed since created)
- ✅ Countdown timer (time until done)
- ❌ No "Start Preparing" button
- ✅ Item status buttons (Cooking/Ready)

**What happens:**
1. Cook clicks "🔥 Start Preparing Order"
2. Backend records `startedPreparationAt` timestamp
3. Backend recalculates `estimatedCompletionTime` from NOW
4. Frontend shows countdown timer
5. Timer counts down in real-time

---

### READY Status (All Items Complete)
```
Table T01
🕐 Received: 23:45
⚡ Time Left: COMPLETED
```

**What shows:**
- ✅ Received timer (still running)
- ✅ Countdown shows "COMPLETED" in green
- ✅ Timer is STOPPED (no longer updating)

**What happens:**
1. Last item marked as "Ready"
2. Countdown timer stops
3. Shows "COMPLETED" status
4. Order ready for serving

---

## Code Changes

### 1. CountdownTimer Component
```javascript
const CountdownTimer = ({ estimatedCompletionTime, orderStatus }) => {
  // Stop timer if order is READY or SERVED
  if (orderStatus === 'READY' || orderStatus === 'SERVED') {
    return <span className="text-green-600">COMPLETED</span>
  }
  
  // Otherwise, show countdown
  // ... countdown logic
}
```

### 2. Conditional Rendering
```javascript
{/* Always show received time */}
<ElapsedTimer since={order.orderTime?.placedAt} />

{/* Only show countdown if cooking started */}
{order.orderStatus !== 'PENDING' && 
 order.orderTime?.startedPreparationAt && 
 order.estimatedCompletionTime && (
  <CountdownTimer 
    estimatedCompletionTime={order.estimatedCompletionTime}
    orderStatus={order.orderStatus}
  />
)}

{/* Show static time if not started */}
{order.orderStatus === 'PENDING' && (
  <div>Est. time: {maxPrepTime} min</div>
)}
```

---

## Timeline Example

### Complete Order Lifecycle

**2:30 PM - Order Created**
```
Status: PENDING
🕐 Received: 00:00
Est. time: 15 min
[Start Preparing] button visible
```

**2:35 PM - Cook Starts Cooking (5 min late)**
```
Status: PREPARING
🕐 Received: 05:00
⚡ Time Left: 15:00  (recalculated: NOW + 15 min = 2:50 PM)
Items show "Cooking" and "✓ Ready" buttons
```

**2:45 PM - Still Cooking**
```
Status: PREPARING
🕐 Received: 15:00
⚡ Time Left: 05:00  (5 minutes remaining)
```

**2:49 PM - Almost Done**
```
Status: PREPARING
🕐 Received: 19:00
⚡ Time Left: 01:00  (Warning - Orange color)
```

**2:50 PM - All Items Ready**
```
Status: READY
🕐 Received: 20:00
⚡ Time Left: COMPLETED  (Green, stopped)
Order ready to serve
```

**2:52 PM - Still Ready (Timer Stopped)**
```
Status: READY
🕐 Received: 22:00  (still counting)
⚡ Time Left: COMPLETED  (still shows COMPLETED, not counting)
```

---

## Key Points

### Received Timer:
- ✅ Always visible
- ✅ Always running
- ✅ Based on `orderTime.placedAt` (when order created)
- ✅ Never stops
- ✅ Shows total time order has existed

### Countdown Timer:
- ✅ Only visible after "Start Preparing" clicked
- ✅ Based on `estimatedCompletionTime` (calculated when cooking starts)
- ✅ **STOPS** when order is READY or SERVED
- ✅ Shows remaining time until done
- ✅ Color-coded by urgency
- ✅ Shows "COMPLETED" when done

---

## Benefits

### For Cooks:
- ✅ Clear indication when to start timer
- ✅ No confusion about timer starting
- ✅ Timer stops when work is done
- ✅ Always see how long order has been waiting

### For Management:
- ✅ Track actual wait times (received timer)
- ✅ Track cooking times (countdown timer)
- ✅ Identify slow cooks or late starts
- ✅ Better kitchen efficiency monitoring

---

## Testing Checklist

- [ ] New order shows received timer starting at 00:00
- [ ] New order shows "Est. time: X min" instead of countdown
- [ ] Clicking "Start Preparing" shows countdown timer
- [ ] Countdown timer counts down correctly
- [ ] Countdown timer stops when all items marked ready
- [ ] "COMPLETED" shows in green when stopped
- [ ] Received timer continues running after order is ready
- [ ] Color changes (blue → orange → red) work correctly
- [ ] Timer handles overtime correctly (shows +MM:SS)
