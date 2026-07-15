"use client";

import RsvpTable from "./components/rsvp-table";

export default function Rsvp() {
  const EXAMPLE_ACCEPTED_RSVP = [
    { name: "Marcus Bennett", createdAt: "2027-05-12", plusOnes: [] },
    {
      name: "Elena Vasquez",
      createdAt: "2027-05-18",
      plusOnes: [{ name: "Diego Vasquez", createdAt: "2027-05-18" }],
    },
    { name: "Priya Chatterjee", createdAt: "2027-06-01", plusOnes: [] },
    {
      name: "Tom Whitfield",
      createdAt: "2027-06-03",
      plusOnes: [
        { name: "Sarah Whitfield", createdAt: "2027-06-03" },
        { name: "Lucas Whitfield", createdAt: "2027-06-03" },
        { name: "Emma Whitfield", createdAt: "2027-06-03" },
      ],
    },
    {
      name: "Grace Okafor",
      createdAt: "2027-06-10",
      plusOnes: [
        { name: "Daniel Okafor", createdAt: "2027-06-10" },
        { name: "Nia Okafor", createdAt: "2027-06-10" },
      ],
    },
    { name: "Henry Kim", createdAt: "2027-06-15", plusOnes: [] },
    {
      name: "Isabella Romano",
      createdAt: "2027-06-20",
      plusOnes: [{ name: "Marco Romano", createdAt: "2027-06-20" }],
    },
    {
      name: "Wei Zhang",
      createdAt: "2027-07-02",
      plusOnes: [
        { name: "Lin Zhang", createdAt: "2027-07-02" },
        { name: "Kai Zhang", createdAt: "2027-07-02" },
        { name: "Mei Zhang", createdAt: "2027-07-02" },
      ],
    },
  ]

  return (
    <div className="w-full min-h-full bg-background font-sans text-burg px-6 py-2 md:px-12 lg:px-16">
      {/** title */}
      <div className="flex flex-col w-full md:flex-row">
        <h1 className="page-title w-full text-center translate-y-3 md:text-start">RSVP Tracker</h1>
        <div className="flex flex-col mt-4 md:w-1/2 md:ml-auto md:mt-0">
          <h2 className="page-title text-xl  text-center md:text-2xl md:text-end">90 Responses</h2>
          <h3 className="section-title text-sm text-center md:text-end">150 Sent</h3>
        </div>
      </div>
      <hr className="mb-5 mt-2 bg-accent md:my-5"/>

      <div className="flex w-full justify-center">
        <div className="grid grid-cols-2 w-full h-full md:grid-cols-4">
          <div className="hidden flex-col w-full h-auto border-e-2 border-e-accent items-center pl-5 md:flex">
            <p className="stat-number">150</p>
            <p className="muted-caption pt-2">Invited</p>
          </div>
          <div className="hidden flex-col w-full h-auto items-center pl-5 md:border-e-2 md:border-e-accent md:flex">
            <p className="stat-number">90</p>
            <p className="muted-caption pt-2">Responded</p>
          </div>
          <div className="flex flex-col w-full h-auto items-center pl-5">
            <p className="stat-number text-olivine">72</p>
            <p className="muted-caption pt-2">Accepted</p>
          </div>
          <div className="flex flex-col w-full h-auto border-s-2 border-s-accent items-center pl-5">
            <p className="stat-number text-destructive">18</p>
            <p className="muted-caption pt-2">Rejected</p>
          </div>
        </div>
      </div>
      <hr className="mb-5 mt-2 bg-accent md:my-5"/>

      {/* Accepted Table */}
      <h3 className="text-xl font-bold text-left text-olivine">ACCEPTED RESPONSES</h3>
      <RsvpTable 
        rsvpData={EXAMPLE_ACCEPTED_RSVP}
      />

      {/* Rejected Table */}
      <h3 className="text-xl font-bold text-left text-destructive mt-10">REJECTED RESPONSES</h3>
      <RsvpTable 
        rsvpData={EXAMPLE_ACCEPTED_RSVP}
      />
    </div>
  );
}
