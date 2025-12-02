"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase, getCurrentUser } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Save, Plus, X, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function EditComparisonPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === "new";
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(!isNew);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [phones, setPhones] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedPhones, setSelectedPhones] = useState([]);
  const [phoneSpecs, setPhoneSpecs] = useState({});
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    is_published: false,
  });

  useEffect(() => {
    loadPhonesAndBrands();
    if (!isNew) {
      loadComparison();
    }
  }, [params.id, isNew]);

  async function loadPhonesAndBrands() {
    const [phonesResult, brandsResult] = await Promise.all([
      supabase
        .from("phones")
        .select("id, model_name, main_image_url, brands(id, name)")
        .eq("is_published", true)
        .order("model_name"),
      supabase.from("brands").select("id, name").order("name"),
    ]);

    if (phonesResult.data) setPhones(phonesResult.data);
    if (brandsResult.data) setBrands(brandsResult.data);
  }

  async function loadComparison() {
    const { data, error } = await supabase
      .from("comparisons")
      .select(
        `
        *,
        comparison_phones (
          phone_id,
          display_order,
          phones (
            id,
            model_name,
            main_image_url,
            brands (name)
          )
        )
      `
      )
      .eq("id", params.id)
      .maybeSingle();

    if (error || !data) {
      router.push("/admin/comparisons");
      return;
    }

    setFormData({
      title: data.title || "",
      slug: data.slug || "",
      description: data.description || "",
      is_published: data.is_published || false,
    });

    if (data.comparison_phones) {
      const selectedPhonesData = data.comparison_phones
        .sort((a, b) => a.display_order - b.display_order)
        .map((cp) => cp.phones)
        .filter(Boolean);

      setSelectedPhones(selectedPhonesData);
      await loadSpecsForPhones(selectedPhonesData.map((p) => p.id));
    }

    setLoadingData(false);
  }

  async function loadSpecsForPhones(phoneIds) {
    if (phoneIds.length === 0) return;

    const { data: specsData } = await supabase
      .from("specifications")
      .select("*")
      .in("phone_id", phoneIds)
      .order("category")
      .order("display_order");

    if (specsData) {
      const specsMap = {};
      specsData.forEach((spec) => {
        if (!specsMap[spec.phone_id]) {
          specsMap[spec.phone_id] = [];
        }
        specsMap[spec.phone_id].push(spec);
      });
      setPhoneSpecs(specsMap);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "title" && (isNew || !formData.slug)) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setFormData((prev) => ({ ...prev, slug }));
    }
  }

  function handleSwitchChange(checked) {
    setFormData((prev) => ({ ...prev, is_published: checked }));
  }

  async function addPhone(phone) {
    if (selectedPhones.find((p) => p.id === phone.id)) return;
    if (selectedPhones.length >= 5) {
      setError("Maximum 5 phones can be compared at once");
      return;
    }

    const newSelectedPhones = [...selectedPhones, phone];
    setSelectedPhones(newSelectedPhones);
    await loadSpecsForPhones([phone.id]);

    if (newSelectedPhones.length === 1 && !formData.title) {
      setFormData((prev) => ({
        ...prev,
        title: `${phone.brands?.name} ${phone.model_name} vs ...`,
      }));
    } else if (newSelectedPhones.length === 2) {
      const phone1 = newSelectedPhones[0];
      const phone2 = newSelectedPhones[1];
      setFormData((prev) => ({
        ...prev,
        title: `${phone1.brands?.name} ${phone1.model_name} vs ${phone2.brands?.name} ${phone2.model_name}`,
        slug: `${phone1.model_name}-vs-${phone2.model_name}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-"),
      }));
    }
  }

  function removePhone(phoneId) {
    setSelectedPhones((prev) => prev.filter((p) => p.id !== phoneId));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!formData.title || !formData.slug) {
      setError("Title and slug are required");
      setLoading(false);
      return;
    }

    if (selectedPhones.length < 2) {
      setError("Please select at least 2 phones to compare");
      setLoading(false);
      return;
    }

    try {
      const user = await getCurrentUser();

      if (isNew) {
        const { data: newComparison, error: insertError } = await supabase
          .from("comparisons")
          .insert({
            title: formData.title,
            slug: formData.slug,
            description: formData.description || null,
            is_published: formData.is_published,
            created_by: user?.id,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        const comparisonPhones = selectedPhones.map((phone, idx) => ({
          comparison_id: newComparison.id,
          phone_id: phone.id,
          display_order: idx,
        }));

        const { error: phonesInsertError } = await supabase
          .from("comparison_phones")
          .insert(comparisonPhones);
        if (phonesInsertError) throw phonesInsertError;

        setSuccess("Comparison created successfully!");
        setTimeout(() => {
          router.push(`/admin/comparisons/${newComparison.id}/edit`);
        }, 1000);
      } else {
        const { error: updateError } = await supabase
          .from("comparisons")
          .update({
            title: formData.title,
            slug: formData.slug,
            description: formData.description || null,
            is_published: formData.is_published,
          })
          .eq("id", params.id);

        if (updateError) throw updateError;

        const { error: deleteError } = await supabase
          .from("comparison_phones")
          .delete()
          .eq("comparison_id", params.id);
        if (deleteError)
          console.warn("Failed to delete old phones:", deleteError);

        const comparisonPhones = selectedPhones.map((phone, idx) => ({
          comparison_id: params.id,
          phone_id: phone.id,
          display_order: idx,
        }));

        const { error: phonesInsertError } = await supabase
          .from("comparison_phones")
          .insert(comparisonPhones);
        if (phonesInsertError) throw phonesInsertError;

        setSuccess("Comparison updated successfully!");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError(err.message || "Failed to save comparison");
    }

    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this comparison?")) return;

    await supabase
      .from("comparison_phones")
      .delete()
      .eq("comparison_id", params.id);
    await supabase.from("comparisons").delete().eq("id", params.id);
    router.push("/admin/comparisons");
  }

  const filteredPhones =
    selectedBrand === "all"
      ? phones
      : phones.filter((p) => p.brands?.id === selectedBrand);

  const allSpecKeys = {};
  Object.values(phoneSpecs).forEach((specs) => {
    specs.forEach((spec) => {
      if (!allSpecKeys[spec.category]) {
        allSpecKeys[spec.category] = new Set();
      }
      allSpecKeys[spec.category].add(spec.spec_key);
    });
  });

  function getSpecValue(phoneId, category, key) {
    const specs = phoneSpecs[phoneId] || [];
    const spec = specs.find(
      (s) => s.category === category && s.spec_key === key
    );
    return spec?.spec_value || "-";
  }

  function areValuesDifferent(category, key) {
    const values = selectedPhones.map((p) => getSpecValue(p.id, category, key));
    const uniqueValues = [...new Set(values.filter((v) => v !== "-"))];
    return uniqueValues.length > 1;
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading comparison...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/comparisons">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            {isNew ? "New Comparison" : "Edit Comparison"}
          </h1>
          {!isNew && formData.title && (
            <p className="text-gray-600 mt-1">{formData.title}</p>
          )}
        </div>
        {!isNew && (
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <form
        onSubmit={handleSubmit}
        onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
        noValidate
      >
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Comparison Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., iPhone 15 Pro vs Samsung S24 Ultra"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="comparison-url-slug"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Brief description..."
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_published"
                    checked={formData.is_published}
                    onCheckedChange={handleSwitchChange}
                  />
                  <Label htmlFor="is_published" className="cursor-pointer">
                    Published
                  </Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add Phones ({selectedPhones.length}/5)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Brands</SelectItem>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filteredPhones.map((phone) => {
                    const isSelected = selectedPhones.find(
                      (p) => p.id === phone.id
                    );
                    return (
                      <div
                        key={phone.id}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-blue-50 opacity-50"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => !isSelected && addPhone(phone)}
                      >
                        <div className="w-10 h-10 relative rounded bg-gray-100 flex-shrink-0">
                          {phone.main_image_url ? (
                            <Image
                              src={phone.main_image_url}
                              alt={phone.model_name}
                              fill
                              className="object-cover rounded"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                              No img
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {phone.model_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {phone.brands?.name}
                          </p>
                        </div>
                        {!isSelected && (
                          <Plus className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Selected Phones</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedPhones.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Select at least 2 phones to compare from the left panel
                  </p>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {selectedPhones.map((phone, idx) => (
                      <div
                        key={phone.id}
                        className="flex-shrink-0 w-32 relative group"
                      >
                        <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100">
                          {phone.main_image_url ? (
                            <Image
                              src={phone.main_image_url}
                              alt={phone.model_name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              No image
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removePhone(phone.id)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-sm font-medium text-center mt-2 truncate">
                          {phone.model_name}
                        </p>
                        <p className="text-xs text-gray-500 text-center">
                          {phone.brands?.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedPhones.length >= 2 &&
              Object.keys(allSpecKeys).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Specification Comparison</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-48 sticky left-0 bg-white">
                              Specification
                            </TableHead>
                            {selectedPhones.map((phone) => (
                              <TableHead
                                key={phone.id}
                                className="min-w-[150px] text-center"
                              >
                                {phone.model_name}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(allSpecKeys).map(
                            ([category, keys]) => (
                              <>
                                <TableRow
                                  key={`cat-${category}`}
                                  className="bg-gray-50"
                                >
                                  <TableCell
                                    colSpan={selectedPhones.length + 1}
                                    className="font-semibold"
                                  >
                                    {category}
                                  </TableCell>
                                </TableRow>
                                {[...keys].map((key) => {
                                  const isDifferent = areValuesDifferent(
                                    category,
                                    key
                                  );
                                  return (
                                    <TableRow key={`${category}-${key}`}>
                                      <TableCell className="font-medium sticky left-0 bg-white">
                                        {key}
                                      </TableCell>
                                      {selectedPhones.map((phone) => {
                                        const value = getSpecValue(
                                          phone.id,
                                          category,
                                          key
                                        );
                                        return (
                                          <TableCell
                                            key={phone.id}
                                            className={`text-center ${
                                              isDifferent
                                                ? "bg-yellow-50 font-medium"
                                                : ""
                                            }`}
                                          >
                                            {value}
                                          </TableCell>
                                        );
                                      })}
                                    </TableRow>
                                  );
                                })}
                              </>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

            {selectedPhones.length >= 2 &&
              Object.keys(allSpecKeys).length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-500">
                      No specifications found for the selected phones.
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Fetch specs from the API for each phone first.
                    </p>
                  </CardContent>
                </Card>
              )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button type="submit" disabled={loading} className="gap-2">
            <Save className="h-4 w-4" />
            {loading
              ? "Saving..."
              : isNew
              ? "Create Comparison"
              : "Save Changes"}
          </Button>
          <Link href="/admin/comparisons">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
