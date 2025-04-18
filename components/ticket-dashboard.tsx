"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TicketList } from "@/components/ticket-list"
import { TicketGenerator } from "@/components/ticket-generator"
import { type TicketData, fetchTicketData } from "@/lib/sheets-service"

export function TicketDashboard() {
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTickets, setSelectedTickets] = useState<TicketData[]>([])

  useEffect(() => {
    const loadTickets = async () => {
      try {
        setIsLoading(true)
        const data = await fetchTicketData()

        const response = await fetch("/api/patron-data", {
          method: "GET"
        })

        const result = await response.json()

        const firstRow = result.shift()

        const firstNameIndex = firstRow.indexOf("First Name")
        const  lastNameIndex = firstRow.indexOf("Last Name")
        const showTitleIndex = firstRow.indexOf("Show Title")
        const    abbrevIndex = firstRow.indexOf("Abbrev")
        const  dateTimeIndex = firstRow.indexOf("Performance Date")
        const   sectionIndex = firstRow.indexOf("Section")
        const       rowIndex = firstRow.indexOf("Row")
        const      seatIndex = firstRow.indexOf("Seat")
        const     isSubIndex = firstRow.indexOf("Is Subscriber?")
        const      codeIndex = firstRow.indexOf("Attendee Code")
        const  dateCodeIndex = firstRow.indexOf("Date Code")

        const ticketData = result.map((row) => {
          return {
            show: row[showTitleIndex],
            dateTime: row[dateTimeIndex],
            name: `${row[firstNameIndex]} ${row[lastNameIndex]}`,
            section: row[sectionIndex],
            row: row[rowIndex],
            seat: row[seatIndex],
            isSubscriber: row[isSubIndex] == "TRUE",
            abbrev: row[abbrevIndex],
            attendeeCode: row[codeIndex],
            dateCode: row[dateCodeIndex],
          }
        }).sort((a, b) => {
          if (a.dateCode < b.dateCode) {
            return -1;
          }
          if (a.dateCode > b.dateCode) {
            return 1;
          }
          return 0;
        })


        
        setTickets(ticketData)
        setError(null)
      } catch (err) {
        setError("Failed to load ticket data. Please check your Google Sheets connection.")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    loadTickets()
  }, [])

  const handleTicketSelect = (ticket: TicketData, isSelected: boolean) => {
    if (isSelected) {
      setSelectedTickets([...selectedTickets, ticket])
    } else {
      setSelectedTickets(
        selectedTickets.filter(
          (t) =>
            !(
              t.name === ticket.name &&
              t.show === ticket.show &&
              t.dateTime === ticket.dateTime &&
              t.section === ticket.section &&
              t.row === ticket.row &&
              t.seat === ticket.seat
            ),
        ),
      )
    }
  }

  return (
    <Tabs defaultValue="list" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="list">Ticket List</TabsTrigger>
        <TabsTrigger value="generate">Generate Tickets</TabsTrigger>
      </TabsList>
      <TabsContent value="list">
        <TicketGenerator tickets={selectedTickets} />
        <TicketList
          tickets={tickets}
          isLoading={isLoading}
          error={error}
          onTicketSelect={handleTicketSelect}
          selectedTickets={selectedTickets}
        />
      </TabsContent>
      <TabsContent value="generate">
      </TabsContent>
    </Tabs>
  )
}
