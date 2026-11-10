# Ethiopian Real Estate Platform

## Complete Real Estate Solution with Multi-role Support

### Features
- Multi-role user system (Seller, Landlord, Buyer, Renter)
- Role-based document verification
- Admin approval workflow
- Subscription payments
- Property listings with draft/approval system
- Real-time chat
- Property analytics

### Setup Instructions

#### Render Deployment
The repository-root `render.yaml` configures the frontend as a Render Static Site and rewrites client-side routes (such as `/admin`) to `index.html`. Apply or sync this Blueprint with the existing Render service. If the service is configured directly in the Render Dashboard instead, add a **Rewrite** rule with source `/*` and destination `/index.html`.

#### Backend Setup
1. Create PostgreSQL database on Neon
2. Copy `.env.example` to `.env` and update credentials
3. Run: `pip install -r requirements.txt`
4. Run: `uvicorn main:app --reload`

#### Frontend Setup
1. Run: `npm install`
2. Run: `npm run dev`

### Database Schema
- Users with multiple roles
- Role-specific document requirements
- Property listings with approval workflow
- Payment and subscription tracking

### API Endpoints
- `/api/auth` - Authentication
- `/api/admin` - Admin operations
- `/api/properties` - Property management
- `/api/verification` - Document verification
- `/api/payments` - Payment processing

### Environment Variables
See `.env.example` for required configuration
