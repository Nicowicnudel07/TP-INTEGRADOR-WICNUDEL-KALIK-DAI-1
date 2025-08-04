-- Insertar provincias
INSERT INTO provinces (id, name, full_name, latitude, longitude, display_order) VALUES
(1, 'Buenos Aires', 'Provincia de Buenos Aires', '-34.61444091796875', '-58.445877075195312', 1),
(2, 'CABA', 'Ciudad Autónoma de Buenos Aires', '-34.61444091796875', '-58.445877075195312', 2);

-- Insertar localidades
INSERT INTO locations (id, name, id_province, latitude, longitude) VALUES
(3391, 'Nuñez', 2, '-34.548805236816406', '-58.463230133056641'),
(3397, 'Villa Crespo', 2, '-34.599876403808594', '-58.438816070556641');

-- Insertar usuarios
INSERT INTO users (first_name, last_name, username, password) VALUES
('Pablo', 'Ulman', 'pablo.ulman@ort.edu.ar', '$2a$10$hashed_password_here'),
('Julian', 'Schiffer', 'jschiffer@email.com', '$2a$10$hashed_password_here');

-- Insertar tags
INSERT INTO tags (id, name) VALUES
(1, 'Rock'),
(2, 'Pop'),
(3, 'Jazz'),
(4, 'Electrónica');

-- Insertar ubicaciones de eventos
INSERT INTO event_locations (id_location, name, full_address, max_capacity, latitude, longitude, id_creator_user) VALUES
(3391, 'Club Atlético River Plate', 'Av. Pres. Figueroa Alcorta 7597', 84567, '-34.54454505693356', '-58.4494761175694', 1),
(3397, 'Movistar Arena', 'Humboldt 450, C1414 Cdad. Autónoma de Buenos Aires', 15000, '-34.593488697344405', '-58.44735886932156', 1);

-- Insertar eventos
INSERT INTO events (name, description, id_event_location, start_date, duration_in_minutes, price, enabled_for_enrollment, max_assistance, id_creator_user) VALUES
('Taylor Swift', 'Un alto show', 1, '2024-03-21 03:00:00', 210, 15500, true, 120000, 2),
('Toto', 'La legendaria banda estadounidense se presentará en Buenos Aires.', 2, '2024-11-22 03:00:00', 120, 150000, true, 12000, 1);

-- Insertar relación evento-tags
INSERT INTO event_tags (id_event, id_tag) VALUES
(1, 1), (1, 2),  -- Taylor Swift: Rock, Pop
(2, 1);           -- Toto: Rock 