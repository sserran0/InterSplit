import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import api from '../lib/api'

interface Group {
    id: string
    name: string
}


export default function DashboardPage() {
    const [groups, setGroups] = useState<Group[]>([])
    const [groupName, setGroupName] = useState('')
    const user = useAuthStore((s) => s.user)
    const logout = useAuthStore((s) => s.logout)
    const navigate = useNavigate()

    useEffect(() => {
        api.get('/groups').then(({data}) => setGroups(data ?? []))
    }, [])

    const createGroup = async () => {
        if (!groupName.trim()) return
        const { data } = await api.post('/groups', { name: groupName })
    setGroups((prev) => [...prev, { id: data.id, name: groupName }])
    setGroupName('')
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold intersplit-header">
          Welcome, {user?.name}
        </h1>
        <Button
          variant="outline"
          onClick={() => { logout(); navigate('/') }}
        >
          Sign out
        </Button>
      </div>

      <div className="flex gap-2 mb-6">
        <Input
          placeholder="New group name e.g. Seoul Trip"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />
        <Button onClick={createGroup}>Create</Button>
      </div>

      <div className="flex flex-col gap-3">
        {groups.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No groups yet — create one above.
          </p>
        )}
        {groups.map((g) => (
          <Card
            key={g.id}
            className="cursor-pointer hover:bg-muted transition-colors"
            onClick={() => navigate(`/group/${g.id}`)}
          >
            <CardContent className="p-4">
              <p className="font-medium">{g.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}