# ERP Case Study Application

A full-stack ERP application implementing the business workflow:

Customer Enquiry → Quotation → Sales Order → Inventory Reservation → Dispatch

## 1. Technology Stack

### Frontend

- React.js
- Vite
- Axios
- React Router
- CSS

### Backend

- Node.js
- Express.js
- Prisma ORM
- JWT Authentication
- bcrypt
- Jest
- Supertest

### Database

- PostgreSQL

## 2. Architecture

The application follows a client-server architecture.

```text
React Frontend
      |
      | REST API / JSON
      ↓
Express.js Backend
      |
      | Prisma ORM
      ↓
PostgreSQL
```
