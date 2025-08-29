'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */ 
    await queryInterface.bulkInsert('Airplanes', [
      {
        modelNumber: ' Boeing 777',
        capacity :'300',
        createdAt:new Date(),
        updatedAt:new Date()
       },
       {
        modelNumber: ' Boeing 444',
        capacity :'300',
        createdAt:new Date(),
        updatedAt:new Date()
       },
       {
        modelNumber: ' Boeing 44',
        capacity :'222',
        createdAt:new Date(),
        updatedAt:new Date()
       },
       {
        modelNumber: ' oeing 777',
        capacity :'96',
        createdAt:new Date(),
        updatedAt:new Date()
         
       },
       {
        modelNumber: ' ming 777',
        capacity :'69',
        createdAt:new Date(),
        updatedAt:new Date()
       }], {});
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
