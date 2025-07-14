CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL
);

-- Tabla de provincias
CREATE TABLE provinces (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  full_name VARCHAR(255),
  latitude VARCHAR(50),
  longitude VARCHAR(50),
  display_order INT
);

-- Tabla de localidades
CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  id_province INT REFERENCES provinces(id),
  latitude VARCHAR(50),
  longitude VARCHAR(50)
);

-- Tabla de ubicaciones de eventos
CREATE TABLE event_locations (
  id SERIAL PRIMARY KEY,
  id_location INT REFERENCES locations(id),
  name VARCHAR(255) NOT NULL,
  full_address VARCHAR(255),
  max_capacity INT NOT NULL,
  latitude VARCHAR(50),
  longitude VARCHAR(50),
  id_creator_user INT REFERENCES users(id)
);

-- Tabla de eventos
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  id_event_location INT REFERENCES event_locations(id),
  start_date TIMESTAMP NOT NULL,
  duration_in_minutes INT NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  enabled_for_enrollment BOOLEAN NOT NULL DEFAULT true,
  max_assistance INT NOT NULL,
  id_creator_user INT REFERENCES users(id)
);

-- Tabla de tags
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

-- Relación muchos a muchos entre eventos y tags
CREATE TABLE event_tags (
  id_event INT REFERENCES events(id),
  id_tag INT REFERENCES tags(id),
  PRIMARY KEY (id_event, id_tag)
);

-- Inscripciones a eventos
CREATE TABLE event_enrollments (
  id SERIAL PRIMARY KEY,
  id_event INT REFERENCES events(id),
  id_user INT REFERENCES users(id),
  registration_date_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  attended BOOLEAN DEFAULT false,
  rating INT,
  description TEXT,
  UNIQUE (id_event, id_user)
);
