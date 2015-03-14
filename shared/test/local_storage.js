/**
 * @fileOverview Gives testing code for the local_storage.js shared library.
 *
 * This spec is managed by the Jasmine testing library.
 **/
describe ("Local Storage Test Suite", function() {
  
 it("can assign to locaStorage and get the item back", function() {
   ls.setItem("hello", "world");
   expect(ls.getItem("hello")).toBe("world");
   ls.removeItem("hello");
 });

 it("knows localStorage is not defined in Xul pages", function() {
   if( privlyNetworkService.platformName() === "FIREFOX" ) {
     expect(ls.localStorageDefined)
          .toBe(false);
   } else {
     expect(ls.localStorageDefined)
          .toBe(true);
   }
 });

 it("can remove items from storage", function() {
    ls.setItem("hello", "world");
    expect(ls.getItem("hello")).toBe("world");
    ls.removeItem("hello");
    expect(ls.getItem("hello")).not.toBeDefined();
  });

  it("can set and get Objects", function() {
    var obj = {"foo": "bar", "bar": "bazz"};
    ls.setItem("key", obj);
    var returned = ls.getItem("key");
    expect(ls.getItem("key")).toEqual(obj);
    expect(returned["foo"]).toBe("bar");
    expect(returned["bar"]).toBe("bazz");
    expect(returned).toEqual(obj);
  });

});
