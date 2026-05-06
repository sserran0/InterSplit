import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
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
    const [confirmDeleteID, setConfirmDeleteID] = useState<string | null>(null)

    useEffect(() => {
        api.get('/groups').then(({data}) => setGroups(data ?? []))
    }, [])

    const createGroup = async () => {
        if (!groupName.trim()) return
        const { data } = await api.post('/groups', { name: groupName })
    setGroups((prev) => [...prev, { id: data.id, name: groupName }])
    setGroupName('')
  }
    const deleteGroup = async (groupId: string) => {
        try{
        await api.delete(`/groups/${groupId}`)
        setGroups((prev) => prev.filter((g) => g.id !== groupId))
        setConfirmDeleteID(null)
    }
    catch (err: any){
        alert(err.response?.data || 'Could not delete group. Please try again.')
    }
}
  return (
    <div className="w-full px-8 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold intersplit-header">
          Welcome, {user?.name}
        </h1>
        <Button
          variant="outline"
          onClick={() => { logout(); navigate('/') }}
          className="cursor-pointer text-white bg-[#2a2b2b] transition-colors duration-200 hover:bg-red-500 hover:text-white"
        >
          Sign out
        </Button>
      </div>

      <div className="flex ml-45 w-150 gap-2 mb-6">
        <Input
          placeholder="New group name e.g. Seoul Trip"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />
        <Button onClick={createGroup} className="cursor-pointer bg-[#2a2b2b] transition-colors duration-200 hover:bg-blue-500">Create</Button>
      </div>

      <h2 className="text-left intersplit-header">Your Groups:</h2>

      <div className="flex flex-col gap-3">
        {groups.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No groups yet — create one above.
          </p>
        )}
        {groups.map((g) => (
            <div key={g.id} className="flex items-center gap-2">
          <Card
            className="flex-1 bg-[#2a2b2b] text-left text-white cursor-pointer transition-colors duration-200 hover:text-black hover:bg-white"
            onClick={() => navigate(`/group/${g.id}`)}
          >
            <CardContent className="p-4">
              <p className="font-medium">{g.name}</p>
            </CardContent>
          </Card>

          {confirmDeleteID === g.id ? (
            <div className="flex items-center gap-2 text-sm">
            <span className="text-white/70">Are You Sure?</span>
            <button className="cursor-pointer text-white transition-colors duration-200 hover:underline hover:text-green-500"
            onClick={() => deleteGroup(g.id)}
            >
                Yes
            </button>
            <button className="cursor-pointer text-white transition-colors duration-200 hover:underline hover:text-red-500"
            onClick={() => setConfirmDeleteID(null)}
            >
                No
            </button>
            </div>
          ) : (
            <button
                className="cursor-pointer text-white transition-colors duration-200 hover:underline hover:text-red-500 p-2"
                    onClick={() => setConfirmDeleteID(g.id)}
                    >
                    <Trash2 size={16}/>
            </button>
          )}
          </div>
        ))}
      </div>
    </div>
  )
}