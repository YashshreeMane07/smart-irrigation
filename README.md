# 🌱 Smart Irrigation System Using Simulated IoT Sensor Data

A software-based Smart Irrigation System that simulates IoT sensor readings to monitor soil conditions and automate irrigation. The system generates virtual soil moisture, temperature and humidity data, and controls a simulated water pump based on predefined moisture thresholds.

This project demonstrates how IoT-based smart irrigation can be implemented and tested without requiring physical sensors, microcontrollers or hardware components.

## 🌐 Live Demo

- **Frontend:** https://smart-irrigation-umit.vercel.app
- **Backend API:** https://smart-irrigation-6ha8.onrender.com

## 📌 Project Overview

Traditional irrigation methods often involve manual monitoring and watering, which can lead to inefficient water usage.

The Smart Irrigation System provides a software-based solution by simulating environmental sensor data and automatically controlling a virtual irrigation pump according to soil moisture conditions.

Users can monitor sensor readings, manage plants, view irrigation information and control the simulated pump through an interactive web dashboard.

## 🎯 Objectives

- Simulate IoT-based environmental sensor data.
- Monitor soil moisture, temperature and humidity.
- Automate irrigation based on soil moisture thresholds.
- Provide manual control of the virtual water pump.
- Maintain plant-specific irrigation requirements.
- Store sensor and irrigation information using SQLite.
- Visualize irrigation conditions through a web dashboard.

## ✨ Key Features

### 1. Sensor Data Simulation
- Generates simulated soil moisture readings.
- Simulates temperature and humidity variations.
- Updates sensor values over time without physical hardware.

### 2. Smart Irrigation Automation
- Automatically activates the virtual pump when soil moisture becomes too low.
- Stops irrigation when the required moisture level is reached.
- Uses threshold-based control with hysteresis to prevent frequent pump switching.

### 3. Manual Pump Control
- Allows users to manually switch the virtual pump ON or OFF.
- Provides an alternative to automatic irrigation mode.

### 4. Plant Management
- Supports plant-specific moisture requirements.
- Uses moisture thresholds to determine irrigation requirements.

### 5. Dashboard and Monitoring
- Displays simulated sensor readings.
- Provides an overview of irrigation and pump status.
- Presents system information through visual components.

### 6. Data Storage
- Uses SQLite to store application data.
- Maintains relevant sensor and irrigation records.

## 🛠️ Technologies Used

| Component | Technologies |
|---|---|
| Frontend | React.js, Vite |
| Styling | CSS |
| Icons | Lucide React |
| Charts | Recharts |
| Backend | Python, Flask |
| API | REST API |
| Database | SQLite |
| Deployment – Frontend | Vercel |
| Deployment – Backend | Render |
| Version Control | Git, GitHub |

## 🏗️ System Architecture

The application follows a frontend-backend architecture.

```text
        USER
          |
          v
   React Web Dashboard
          |
          | REST API Requests
          v
      Flask Backend
          |
     +----+----------------+
     |                     |
     v                     v
Simulation Engine      SQLite Database
     |
     v
Virtual Sensor Data
     |
     +-- Soil Moisture
     +-- Temperature
     +-- Humidity
     |
     v
Irrigation Control Logic
     |
     v
  Virtual Water Pump
```

## 🔄 Working Principle

1. The simulation engine generates changing soil moisture, temperature and humidity values.
2. The backend processes the simulated sensor readings.
3. The system compares soil moisture with the selected plant's moisture threshold.
4. In automatic mode, the irrigation logic activates the virtual pump when moisture falls below the lower threshold.
5. The pump stops when the upper moisture threshold is reached.
6. In manual mode, the user controls the virtual pump directly.
7. Relevant application data is stored in the SQLite database.
8. The frontend retrieves and displays information through REST API requests.

## 📂 Project Structure

```text
smart-irrigation/
│
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── ... (other backend modules)
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── ... (other frontend files)
│
├── README.md
└── .gitignore
```

## ⚙️ Installation and Setup

Follow these steps to run the project locally.

### Prerequisites

Make sure you have installed:

- Python 3.x
- Node.js and npm
- Git
- Visual Studio Code (recommended)

### 1. Clone the Repository

```bash
git clone https://github.com/YashshreeMane07/smart-irrigation.git
```

Navigate to the project directory:

```bash
cd smart-irrigation
```

### 2. Set Up the Backend

Open a terminal and navigate to the backend directory:

```bash
cd backend
```

Create a Python virtual environment:

```bash
python -m venv venv
```

Activate the virtual environment on Windows:

```bash
venv\Scripts\activate
```

Install the required dependencies:

```bash
pip install -r requirements.txt
```

Start the Flask backend:

```bash
python app.py
```

The backend will run at:

```text
http://127.0.0.1:5000
```

### 3. Set Up the Frontend

Open another terminal and navigate to the frontend directory:

```bash
cd smart-irrigation/frontend
```

Install the dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

Open the local frontend URL displayed in the terminal, usually:

```text
http://localhost:5173
```

**Note:** For local development, configure the frontend API requests to use the local Flask backend through the Vite proxy. For production, use the deployed backend URL through the `VITE_API_URL` environment variable.

## 🔗 Deployment

The project is deployed using separate frontend and backend hosting services.

| Service | Platform |
|---|---|
| React Frontend | Vercel |
| Flask Backend | Render |

### Production Backend URL

```text
https://smart-irrigation-6ha8.onrender.com
```

### Frontend Environment Variable

Configure the following environment variable in Vercel:

```env
VITE_API_URL=https://smart-irrigation-6ha8.onrender.com
```

## 🔮 Future Enhancements

- Integration with real IoT sensors and microcontrollers.
- Weather-based irrigation recommendations.
- Water consumption tracking and optimization.
- Notifications for low soil moisture conditions.
- Mobile-friendly monitoring and control.
- Advanced analytics and irrigation reports.

## 💡 Advantages

- No physical IoT hardware is required for testing.
- Reduces the cost of initial development and experimentation.
- Demonstrates automated irrigation logic.
- Provides centralized monitoring and control.
- Can be extended to support real-world IoT devices.

## 👩‍💻 Author

**Yashshree Mane**

Computer Engineering Student

GitHub: [@YashshreeMane07](https://github.com/YashshreeMane07)

## 📄 License

This project is developed for educational and academic purposes.

---

⭐ If you find this project interesting, consider giving the repository a star!
