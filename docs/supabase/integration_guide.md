# ambi-tasker API Integration Guide (Supabase)

This document provides ready-to-use JavaScript/TypeScript snippets for interacting with the Supabase backend using the `@supabase/supabase-js` client.

## 1. Identity & User Management

### Fetch All Customers (Admin View)
Retrieves the unified profiles for users with the 'user' role.
```typescript
const { data: users, error } = await supabase
  .from('profiles')
  .select(`
    *,
    users_details (*)
  `)
  .eq('role', 'user')
  .order('created_at', { ascending: false });
```

### Fetch Pending Providers
Retrieves professionals awaiting verification for the Admin Approval Workflow.
```typescript
const { data: pendingProviders, error } = await supabase
  .from('providers')
  .select(`
    id,
    approval_status,
    service_description,
    experience_years,
    profiles (full_name, email, profile_image)
  `)
  .eq('approval_status', 'pending');
```

---

## 2. Admin Operations

### Approve/Reject a Provider (RPC)
Calls the secure database function to transition a provider's state and trigger notifications.
```typescript
const approveProvider = async (providerId: string) => {
  const { error } = await supabase.rpc('audit_provider_onboarding', {
    target_provider_id: providerId,
    new_status: 'approved' // or 'rejected'
  });
  
  if (error) console.error('Audit failed:', error.message);
};
```

### Fetch Dashboard Analytics
Fetches the aggregated metrics from the real-time analytical view.
```typescript
const { data: stats, error } = await supabase
  .from('admin_dashboard_stats')
  .select('*')
  .single();
```

---

## 3. Marketplace & Transactions

### Create a Service Booking
Initiates a new transaction between a customer and a provider.
```typescript
const createBooking = async (bookingData: {
  provider_id: string;
  service_id: string;
  scheduled_date: string;
  location: string;
  total_price: number;
}) => {
  const { data, error } = await supabase
    .from('bookings')
    .insert([{
      ...bookingData,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      booking_status: 'pending',
      payment_status: 'pending'
    }])
    .select();
};
```

### Update Booking Status (Provider Action)
Allows a provider to accept or progress a job.
```typescript
const updateStatus = await supabase
  .from('bookings')
  .update({ booking_status: 'accepted' })
  .eq('id', bookingId);
```

---

## 4. Real-Time Communication

### Send a Message
Injects a message into an existing conversation.
```typescript
const sendMessage = async (conversationId: string, text: string) => {
  const { error } = await supabase
    .from('messages')
    .insert([{
      conversation_id: conversationId,
      sender_id: (await supabase.auth.getUser()).data.user?.id,
      message_text: text
    }]);
};
```

### Subscribe to Real-Time Messages
Registers a listener for instant chat updates.
```typescript
const messageSubscription = supabase
  .channel('public:messages')
  .on('postgres_changes', { 
    event: 'INSERT', 
    schema: 'public', 
    table: 'messages'
  }, (payload) => {
    console.log('New message received!', payload.new);
    // Update your React state here
  })
  .subscribe();

// Remember to unsubscribe on component unmount
// messageSubscription.unsubscribe();
```

---

## 5. Summary of Service Hooks

| Operation | Table/Function | Method |
|-----------|----------------|--------|
| List Users | `profiles` | `select()` |
| Verify Provider | `audit_provider_onboarding` | `rpc()` |
| Create Job | `bookings` | `insert()` |
| List Jobs | `bookings` | `select()` |
| Pay Job | `payments` | `insert()` |
| Chat | `messages` | `insert()` / `on()` |
