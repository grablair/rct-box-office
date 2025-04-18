"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, RefreshCw } from "lucide-react"
import type { TicketData } from "@/lib/sheets-service"

interface TicketListProps {
  tickets: TicketData[]
  isLoading: boolean
  error: string | null
  onTicketSelect: (ticket: TicketData, isSelected: boolean) => void
  selectedTickets: TicketData[]
}

export function TicketList({ tickets, isLoading, error, onTicketSelect, selectedTickets }: TicketListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilter, setShowFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")

  // Get unique shows and dates for filters
  const uniqueShows = Array.from(new Set(tickets.map((ticket) => ticket.show)))
  const uniqueDates = Array.from(
    new Set(
      tickets.map((ticket) => {
        // Extract just the date part from dateTime
        return ticket.dateTime
      }),
    ),
  )

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.row.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.seat.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesShow = showFilter === "all" || ticket.show === showFilter
    const matchesDate = dateFilter === "all" || ticket.dateTime.includes(dateFilter)

    return matchesSearch && matchesShow && matchesDate
  })

  const isTicketSelected = (ticket: TicketData) => {
    return selectedTickets.some(
      (t) =>
        t.name === ticket.name &&
        t.show === ticket.show &&
        t.dateTime === ticket.dateTime &&
        t.section === ticket.section &&
        t.row === ticket.row &&
        t.seat === ticket.seat,
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-600">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ticket Holders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, section, row, or seat..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={showFilter} onValueChange={setShowFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by show" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Shows</SelectItem>
              {uniqueShows.map((show) => (
                <SelectItem key={show} value={show}>
                  {show}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              {uniqueDates.map((date) => (
                <SelectItem key={date} value={date}>
                  {date}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Show</TableHead>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Row</TableHead>
                  <TableHead>Seat</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                      No tickets found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTickets.map((ticket, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Checkbox
                          checked={isTicketSelected(ticket)}
                          onCheckedChange={(checked) => {
                            onTicketSelect(ticket, checked === true)
                          }}
                        />
                      </TableCell>
                      <TableCell>{ticket.name}</TableCell>
                      <TableCell>{ticket.show}</TableCell>
                      <TableCell>{ticket.dateTime}</TableCell>
                      <TableCell>{ticket.section}</TableCell>
                      <TableCell>{ticket.row}</TableCell>
                      <TableCell>{ticket.seat}</TableCell>
                      <TableCell>
                        {ticket.isSubscriber ? (
                          <Badge variant="default">Subscriber</Badge>
                        ) : (
                          <Badge variant="outline">Regular</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="mt-4 text-sm text-muted-foreground">
          {filteredTickets.length} ticket{filteredTickets.length !== 1 ? "s" : ""} found
        </div>
      </CardContent>
    </Card>
  )
}
