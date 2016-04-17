// app/inventory.js
//
// I usually put everything separately

(function(angular){
    "use strict";

    angular.module("appInventory", ["ngRoute"]);
    var appInventory = angular.module("appInventory");

    // Main Controller
    appInventory.controller("InventoryController", InventoryController);
    appInventory.factory("$inventory", inventoryService);
    // Set config core module
    appInventory.config(inventoryConfig);

    // Functions
    InventoryController.$inject = ["$inventory"];
    function InventoryController($inventory) {
        var ctlr = this;
        ctlr.values = [];
        ctlr.types = [];

        $inventory.getInventorys().then(function(res){
            ctlr.values = res.data;
        });
        $inventory.getTypes().then(function(res){
            ctlr.types = res.data;
        });
    }

    inventoryConfig.$inject = ["$routeProvider"];
    function inventoryConfig($routeProvider) {
        $routeProvider
            .when('/inventorys', {
                templateUrl: "partials/inventorys.html",
                controller: "InventoryController",
                controllerAs: "inventory"
            });
    }

    inventoryService.$inject = ["$q", "$http"];
    function inventoryService($q, $http) {
        // Members
        return {
            getInventorys: getInventorys,
            getTypes: getTypes
        };

        function getInventorys() {
            var deferred = $q.defer();
            // Request
            $http({
                url: "/api/inventorys",
                method: "GET"
            }).then(function(res){
                deferred.resolve(res.data);
            }).catch(function(err){
                deferred.reject(err);
            });
            return deferred.promise;
        }

        function getTypes() {
            var deferred = $q.defer();
            // Request
            $http({
                url: "/api/types",
                method: "GET"
            }).then(function(res){
                deferred.resolve(res.data);
            }).catch(function(err){
                deferred.reject(err);
            });
            return deferred.promise;
        }
    }


})(window.angular);
