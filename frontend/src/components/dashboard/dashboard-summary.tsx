import { Card, CardBody, Spinner, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@nextui-org/react"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "../../lib/api"

interface ScopeSummaryResponse {
  scopeId: string
  totalProperties: number
  totalConfiguredDepartments: number
  activeUsersCount: number
  propertyBreakdown: {
    id: string
    name: string
    code: string
    departmentCount: number
  }[]
}

export function DashboardSummary() {
  const { data, isLoading } = useQuery<ScopeSummaryResponse>({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const res = await apiClient.get("/dashboard/summary")
      return res.data
    },
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" color="primary" label="Aggregating scope metrics..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Operational Aggregations</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-gray-200 shadow-sm">
          <CardBody className="p-4">
            <p className="text-xs uppercase font-semibold text-gray-500">Scoped Properties</p>
            <p className="text-3xl font-extrabold text-blue-600 mt-2">{data?.totalProperties || 0}</p>
          </CardBody>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardBody className="p-4">
            <p className="text-xs uppercase font-semibold text-gray-500">Configured Departments</p>
            <p className="text-3xl font-extrabold text-indigo-600 mt-2">{data?.totalConfiguredDepartments || 0}</p>
          </CardBody>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardBody className="p-4">
            <p className="text-xs uppercase font-semibold text-gray-500">Active Scoped Users</p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-2">{data?.activeUsersCount || 0}</p>
          </CardBody>
        </Card>
      </div>

      {/* Property Breakdown Table */}
      <Card className="border border-gray-200 shadow-sm p-4">
        <h3 className="text-md font-semibold text-gray-700 mb-4">Property Department Allocation</h3>
        <Table aria-label="Scoped Properties Table">
          <TableHeader>
            <TableColumn>PROPERTY CODE</TableColumn>
            <TableColumn>NAME</TableColumn>
            <TableColumn>DEPARTMENTS COUNT</TableColumn>
          </TableHeader>
          <TableBody emptyContent="No properties available under current scope.">
            {(data?.propertyBreakdown || []).map((prop) => (
              <TableRow key={prop.id}>
                <TableCell className="font-mono text-sm">{prop.code}</TableCell>
                <TableCell className="font-medium">{prop.name}</TableCell>
                <TableCell>{prop.departmentCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}