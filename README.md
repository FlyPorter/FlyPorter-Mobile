# ECE1724 Project Proposal -- FlightGo Flight Booking System

Guanhong Wu 1002377475 guanhong.wu@mail.utoronto.ca GitHub: `GuanhongW` <br>
Gan Yang 1000909163 gabriel.yang@mail.utoronto.ca GitHub: `ganyangut` <br>
Yiyang Wang 1010033278 ydev.wang@mail.utoronto.ca GitHub: `yiyangww` <br>
Jiaqi Wang 1010099108 jqjqjq.wang@mail.utoronto.ca GitHub: `jiaqiwangut`

---

### 1. Motivation

Air travel has become an essential part of life—whether for business, education, or travel. Nonetheless, the process of booking flights often remains inconvenient due to cluttered platforms, hidden fees, slow response times, and unresponsive pages. Many existing flight portals focus on advertising and upselling, leading to overwhelming interfaces that neglect the user experience. In addition, travelers often navigate between separate airline and comparison sites for seat selection, flight information, and booking confirmations, further complicating the process.

These hurdles, combined with high concurrent traffic during peak booking times, often result in slow response times, unresponsive actions, and even system crashes. Moreover, users frequently face inconsistent seat availability due to delayed data synchronization, resulting in frustration and booking errors. To address these challenges, we propose a flight booking web app called FlightGo that prioritizes simplicity, speed, and reliability—ensuring users can efficiently search, book, and manage flights without unnecessary obstacles.

FlightGo will leverage React and Express.js with PostgreSQL for fast, optimized front-end performance and ensure efficient, scalable backend operations. Through real-time seat availability updates and concurrency-safe booking processes, FlightGo provides a seamless and reliable experience, even during high-demand periods. By integrating advanced concurrency handling and optimized database transactions, FlightGo aims to set a new standard for user-friendly, high-performance flight booking experiences.

FlightGo is designed for users including busy professionals, students, and frequent flyers who need a fast and reliable way to book flights. Business travelers often require last-minute bookings with minimal hassle, while students and budget-conscious travelers prioritize cost-effective options and clear availability. Additionally, airline administrators are also target users as they play a crucial role in managing flights efficiently. FlightGo provides an admin page that allows airline staff to create, update, and manage flights, ensuring accurate and up-to-date information is available to customers. By streamlining the booking process and ensuring real-time flight status updates, FlightGo eliminates the frustration of navigating between multiple platforms to compare prices, check seat availability, and manage reservations.

Some websites just remove user login requirements and account functions entirely, sending booking details via email to simplify operations and reduce costs. While this solution makes the process faster, it also limits users from managing or canceling bookings easily, requiring direct contact with airlines.

Overall, FlightGo balances efficiency with convenience by keeping user accounts, allowing travelers to book seamlessly while also managing their reservations with ease. Ultimately, this project aims to provide a reliable alternative to current flight booking systems. Users will benefit from a clear, optimized interface that enhances trust and usability. Admins can efficiently manage flights while improving the passenger experience.

---

### 2. Objective and Key Features

FlightGo aims to create a smooth and efficient flight ticket booking system that enhances user experience through simplicity, speed, and reliability. Our objective is to develop a full-featured platform where users can easily search for flights, select seats, book tickets, and receive automated email confirmations. Additionally, an admin panel will be included for managing flights and bookings.

By leveraging modern web technologies, FlightGo ensures that the booking process remains intuitive and accessible, minimizing user frustration and maximizing convenience.

#### **Core Features**

- **Authentication (authn)**

  - Users must authenticate before accessing functionalities to protect personal data.
  - Sign-up/login using email (username) and password.
  - Multi-factor authentication (MFA) with email verification for security.

- **Authorization (authz)**

  - Different roles control access to data and functionalities:
    - **Customer**: Search for flights, book tickets, select seats, and manage their bookings.
    - **Administrator**: Manage flight information (add, update, delete flights).

- **Flight Management**

  - Administrators will have the ability to manage flight data, including adding, updating, and deleting flights in the system. This feature will be restricted to administrators only.

- **Flight Search**

  - Customers can search for flights based on:
    - Trip type (one-way or round-trip)
    - Departure and arrival dates/times
    - Departure and arrival cities/airports
    - Flight duration
    - Airlines
    - Price range

- **Flight Booking**

  - Customers can book available flights and choose their seats once their booking is confirmed.

- **Booking Management**

  - Customers will be able to view and cancel their bookings.
  - Customers will be able to modify their seats on their bookings.

- **Automated Email Confirmations**

  - The system will automatically send email confirmations for new bookings or any changes made to existing bookings, keeping customers informed about their flight statuses.

- **PostgreSQL for Flight and Booking Data**
  - The following UML diagram shows the draft database schema of our project:</br>
    ![Database Schema](https://github.com/GuanhongW/ECE1724ReactProject/blob/proposal/database%20schema.png)

#### **Optional Features**

If the core features are implemented before the deadline, the team will work on the following optional features:

- **Google Account Login**: Users can log in with Google.
- **User Reviews**: After their flights, customers can leave reviews, helping future travelers make informed decisions.
- **Flight Check-in**: Customers will be able to check in for their flights within 24 hours of departure. A real-time dashboard on their homepage will show flights that have been checked in.
- **Tiered Pricing & Discount Codes**: Administrators can set different pricing for seats in various cabins, as well as create discount codes that customers can use when booking tickets.

#### **Technology Stack**

- **Frontend**: React + Tailwind CSS for a modular, responsive UI.
- **Backend**: Express.js for APIs, PostgreSQL for structured data.
- **Cloud Storage**: Handle necessary file processing (e.g., ticket receipts).
- **API Integrations**: Implement email notifications for bookings.

Regarding the frontend, the team will use React for UI development, ensuring a modular, efficient, and dynamic user experience. React’s component-based structure allows for reusability and easy maintenance, making it an ideal choice for building a responsive and interactive flight booking platform. Tailwind CSS will be utilized for styling, enabling a responsive and aesthetically pleasing interface that adapts well to different screen sizes. Its utility-first approach ensures rapid development while maintaining consistency in design. Additionally, the team will employ shadcn/ui or similar component libraries to enhance UI consistency and improve development efficiency.

We will use PostgreSQL as our relational database to store flight schedules, user information, and booking records efficiently. PostgreSQL’s support for complex queries, ACID compliance, and scalability makes it a robust choice for handling structured flight and booking data. Cloud storage will be integrated to handle any necessary file processing, such as ticket receipts or user profiles.

The architecture will have separate frontend and backend to ensure flexibility and maintainability. The frontend will be a React-based interface that interacts with the backend through RESTful APIs, allowing for a clear separation of concerns. The backend will be an Express.js server that manages authentication, flight data, booking logic, and email confirmations. By implementing a well-structured RESTful API, we will ensure modularity and scalability, making it easier to extend or modify the system as needed.

Regarding advanced features, the team will implement user authentication and authorization and API integration with external services. Our login system will provide authentication features based on credentials with MFA. Also, the system will provide authorization features based on the role of the user. For the API integration with external services, we plan to enable email communication for all booking actions in the FightGo system. For example, when the user books a flight in the system, the backend service will trigger an email confirmation to the user's email address.

The project will focus on building a secure and smooth flight booking system. The core features listed above will be completed first within the six-week timeframe. The core features will allow users to manage and search for flights, select seats interactively, and complete reservations smoothly. If time is allowed, we will implement the above optional features based on the progress. The goal is to complete all core features before the deadline of the project.

---

### 3. Tentative Plan

Our four-member team will collaborate closely to develop FlightGo within six weeks before the course deadline.

#### **Backend Roles**

- **Guanhong Wu**

  - **Database Schema Design**: Design and finalize the database schema to ensure efficient data storage and retrieval.
  - **User Authentication System**: Implement user registration, login, and multi-factor authentication (MFA) for secure access.
  - **Email Notification Service**: Develop APIs to send email confirmations for bookings and updates.

- **Gan Yang**
  - **Flight Booking APIs**: Implement backend logic for searching flights, booking flights, and canceling bookings.
  - **Seat Selection APIs**: Implement backend logic for selecting seats and modifying seat selections.
  - **Flight Management APIs**: Develop admin functionalities for adding, updating, and deleting flights in the system.

#### **Frontend Roles**

- **Yiyang Wang**

  - **Flight Search Interface**: Develop React components for search filters (date, location, price range, airlines).
  - **Seat Selection Interface**: Implement visual seat selection.
  - **Flight Booking Interface**: UI for booking process.

- **Jiaqi Wang**
  - **User Authentication & Profile Management**: User registration, login, and account management.
  - **Booking Management Interface**: Dashboard for users to view, modify, or cancel bookings.
  - **Admin Page for Flight Management**: Interface for administrators to manage flights.

#### **Collaboration & Integration**

- Weekly meetings to track progress and discuss issues.
- Parallel frontend and backend development based on aligned APIs, with the frontend using dummy data initially.
- Git for version control, using feature branches and merges.

We will follow an agile approach, iterating through development and regular evaluations. With clear roles, strong teamwork, and structured planning, we are confident in delivering a fully functional, high-quality flight booking system within the six-week timeframe.