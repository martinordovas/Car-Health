-- Foto opcional del vehículo.
-- Se guarda como data URL comprimida (JPEG/PNG/WebP/AVIF) generada por el cliente.
ALTER TABLE vehicles ADD COLUMN photo_data VARCHAR(1000000);
