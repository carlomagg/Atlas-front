import React, { useState } from 'react';

const ManageGroups = () => {
  const [formData, setFormData] = useState({
    groupName: '',
    displayOrder: '',
    parentGroup: ''
  });

  const [groups, setGroups] = useState([
    {
      id: 1,
      name: 'Friends',
      parentGroup: 'None',
      displayOrder: 1
    },
    {
      id: 2,
      name: 'Oaks',
      parentGroup: 'Atlas',
      displayOrder: 2
    }
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddGroup = () => {
    if (formData.groupName.trim()) {
      const newGroup = {
        id: groups.length + 1,
        name: formData.groupName,
        parentGroup: formData.parentGroup || 'None',
        displayOrder: parseInt(formData.displayOrder) || groups.length + 1
      };
      setGroups([...groups, newGroup]);
      setFormData({
        groupName: '',
        displayOrder: '',
        parentGroup: ''
      });
    }
  };

  const handleEdit = (id) => {
    console.log('Edit group:', id);
  };

  const handleRemove = (id) => {
    setGroups(groups.filter(group => group.id !== id));
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">Manage Group</h1>
        
        {/* Add Group Section */}
        <div className="mb-8">
          <div className="bg-blue-100 border-l-4 border-blue-500 p-4 mb-6">
            <h2 className="text-lg font-medium text-blue-800 mb-4">Add Group</h2>
            
            <div className="space-y-4">
              {/* Group Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  *Group name
                </label>
                <input
                  type="text"
                  name="groupName"
                  value={formData.groupName}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter group name"
                />
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display order
                </label>
                <input
                  type="number"
                  name="displayOrder"
                  value={formData.displayOrder}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter display order"
                />
              </div>

              {/* Parent Group */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent group
                </label>
                <select
                  name="parentGroup"
                  value={formData.parentGroup}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select parent group</option>
                  <option value="None">None</option>
                  <option value="Atlas">Atlas</option>
                  <option value="Friends">Friends</option>
                </select>
              </div>

              {/* Add Button */}
              <div className="pt-2">
                <button
                  onClick={handleAddGroup}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium text-sm"
                >
                  Add it now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Manage Group Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-800">Manage group</h2>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-sm font-medium">
              Company: Atlantic ocean
            </div>
          </div>

          {/* Groups Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-700">Group name</th>
                  <th className="text-left p-4 font-medium text-gray-700">Parent group</th>
                  <th className="text-left p-4 font-medium text-gray-700">Display order</th>
                  <th className="text-left p-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {groups.map((group) => (
                  <tr key={group.id} className="hover:bg-gray-50">
                    <td className="p-4 text-gray-900 font-medium">{group.name}</td>
                    <td className="p-4 text-gray-900">{group.parentGroup}</td>
                    <td className="p-4 text-gray-900">{group.displayOrder}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(group.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRemove(group.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageGroups;
