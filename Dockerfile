FROM php:8.2-apache

# Instalar dependencias del sistema
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    git && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*


# Crear y activar entorno virtual Python
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Instalar conector MySQL para Python
RUN pip install mysql-connector-python --break-system-packages

# Instalar extensiones de PHP necesarias
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Habilitar mod_rewrite de Apache
RUN a2enmod rewrite

# Instalar Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Establecer directorio de trabajo
WORKDIR /var/www/html/backend

# Copiar composer.json e instalar dependencias PHP
COPY ./backend/composer.json ./
RUN composer install

# Ahora sí, copiar todo el backend y frontend
COPY ./backend/ /var/www/html/backend/
COPY ./frontend/ /var/www/html/frontend/

# Establecer permisos correctos
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80
