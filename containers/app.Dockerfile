### MAIN APPLICATION CONTAINER ###
## Contains the main Express.JS application that will run the server itself. ##
## DEPENDS: mongo.Dockerfile, nginx.Dockerfile ##

#Set the base image as NodeJS (LTS via Alpine)
FROM node:lts-alpine

#Set up the working directories and set them as the working directories
RUN mkdir /opt/throwdown-server
WORKDIR /opt/throwdown-server

#Copy the package definitions to the container
COPY package*.json ./

#Install the required packages
RUN npm install

#Copy the rest of the data to the container
COPY . .

#Expose the required outbound ports
EXPOSE 8080:8080 8443:8443 8750:8750

#Change some config entries to reflect the enviornment change
RUN sed -i 's/mongodb:\/\/localhost/mongodb:\/\/mongo/' .env

#Run the application
CMD ["npm", "run-script", "dev"]