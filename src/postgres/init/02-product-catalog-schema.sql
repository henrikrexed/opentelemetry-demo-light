-- Product Catalog schema and seed data.
-- Runs against the product_catalog database.

\connect product_catalog;

CREATE TABLE IF NOT EXISTS products (
    id          VARCHAR(36)     PRIMARY KEY,
    name        VARCHAR(255)    NOT NULL,
    description TEXT            NOT NULL DEFAULT '',
    picture     VARCHAR(255)    NOT NULL DEFAULT '',
    price_usd_cents INTEGER     NOT NULL DEFAULT 0,
    categories  TEXT[]          NOT NULL DEFAULT '{}'
);

-- Seed data: telescopes and accessories from the original opentelemetry-demo
INSERT INTO products (id, name, description, picture, price_usd_cents, categories) VALUES
(
    'OLJCESPC7Z',
    'National Park Foundation Explorascope',
    'The National Park Foundation Explorascope is a perfect way to get young people excited about astronomy and the night sky. This 50mm refracting telescope provides bright, crisp views of the Moon and its craters, as well as the rings of Saturn.',
    '/images/NationalParkFoundationExplorascope.jpg',
    10199,
    ARRAY['telescopes']
),
(
    '66VCHSJNUP',
    'Starsense Explorer Tabletop Telescope',
    'The Starsense Explorer Tabletop Telescope uses your smartphone to help you find stars, planets, galaxies, and more. Simply dock your phone, look through the eyepiece, and a real-time display on your phone points you to interesting objects.',
    '/images/StarsenseExplorerTabletopTelescope.jpg',
    21999,
    ARRAY['telescopes']
),
(
    '1YMWWN1N4O',
    'Eclipsmart Travel Refractor Telescope',
    'The Eclipsmart Travel Refractor Telescope is perfect for observing the Sun safely. It features a built-in solar filter and a lightweight, portable design. Great for solar eclipses, sunspots, and solar transits.',
    '/images/EclipsmartTravelRefractorTelescope.jpg',
    12999,
    ARRAY['telescopes', 'travel']
),
(
    'L9ECAV7KIM',
    'Lens Cleaning Kit',
    'A comprehensive lens cleaning kit for telescopes and binoculars. Includes a blower brush, cleaning solution, microfiber cloths, and lens tissue. Keep your optics crystal clear for the best viewing experience.',
    '/images/LensCleaningKit.jpg',
    3999,
    ARRAY['accessories']
),
(
    '2ZYFJ3GM2N',
    'Roof Binoculars',
    'High-quality roof prism binoculars with 10x42 magnification. Excellent for stargazing, birdwatching, and outdoor events. Features multi-coated optics, waterproof construction, and a comfortable ergonomic design.',
    '/images/RoofBinoculars.jpg',
    20999,
    ARRAY['binoculars']
),
(
    '0PUK6V6EV0',
    'Solar System Color Imager',
    'A high-speed planetary camera for capturing detailed images of the Moon, planets, and the Sun (with proper filtering). USB 3.0 interface with included capture software.',
    '/images/SolarSystemColorImager.jpg',
    17499,
    ARRAY['accessories', 'cameras']
),
(
    'LS4PSXUNUM',
    'Red Flashlight',
    'A red LED flashlight designed for astronomy. The red light preserves your night vision while providing enough illumination to read star charts, adjust equipment, and navigate in the dark.',
    '/images/RedFlashlight.jpg',
    1099,
    ARRAY['accessories']
),
(
    '9SIQT8TOJO',
    'Optical Tube Assembly',
    'A 6-inch f/5 Newtonian optical tube assembly. This fast focal ratio makes it ideal for deep-sky astrophotography. Includes a 2-inch Crayford focuser and dovetail mounting plate.',
    '/images/OpticalTubeAssembly.jpg',
    34999,
    ARRAY['telescopes', 'assemblies']
),
(
    '6E92ZMYYFZ',
    'Solar Filter',
    'A glass solar filter that fits telescopes with an outer diameter of 100-120mm. Provides safe, full-aperture solar viewing for observing sunspots, solar eclipses, and planetary transits.',
    '/images/SolarFilter.jpg',
    2199,
    ARRAY['accessories', 'filters']
),
(
    'HQTGWGPNH4',
    'The Stargazer Handbook',
    'An illustrated guide to the night sky. Learn to identify constellations, planets, and deep-sky objects with detailed star charts and tips for observers at all levels.',
    '/images/TheStargazerHandbook.jpg',
    1899,
    ARRAY['books']
);
